"use client";

import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { onUnauthorized, setSessionRefresher, setTokenSource } from "@/lib/api-client";
import type { User } from "./types";
import { authApi, loginErrorKey } from "./api";
import { session } from "./session";

export type LoginResult = { ok: true } | { ok: false; errorKey: string };

/** Why the user is logged out: they chose to, or their session ended on its own. */
export type SignOutReason = "signed-out" | "expired";

interface AuthState {
  user: User | null;
  /**
   * The short-lived access token. It lives only in this in-memory store, never in
   * storage; the httpOnly refresh-token cookie restores it after a reload.
   */
  accessToken: string | null;
  /** True until the refresh-token cookie has been checked for a session. */
  isLoading: boolean;
  /** Set once a session has ended during this visit; null for visitors who never logged in. */
  signOutReason: SignOutReason | null;

  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  /** Trades the refresh-token cookie for a new access token; resolves null when there is no session. */
  refresh: () => Promise<User | null>;
  endSession: (reason: SignOutReason) => void;
  /** After the user changed their name or password, the backend's fresh user/session. */
  updateSession: (changes: { user: User; accessToken?: string }) => void;
}

let pendingRefresh: Promise<User | null> | null = null;

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  signOutReason: null,

  login: async (email, password) => {
    try {
      const { user, accessToken } = await authApi.login(email.trim(), password);
      set({ user, accessToken, signOutReason: null, isLoading: false });
      session.broadcast("login");
      return { ok: true };
    } catch (err) {
      return { ok: false, errorKey: loginErrorKey(err) };
    }
  },

  logout: () => {
    // The cookie is httpOnly, so only the backend can revoke and clear it.
    authApi.logout().catch(() => {});
    get().endSession("signed-out");
    session.broadcast("logout");
  },

  // Concurrent callers (several requests hitting 401 at once, StrictMode's double
  // effects) share one request.
  refresh: () => {
    pendingRefresh ??= authApi
      .refresh()
      .then(
        ({ user, accessToken }) => {
          set({ user, accessToken, signOutReason: null });
          return user;
        },
        () => {
          set({ accessToken: null });
          return null;
        }
      )
      .finally(() => {
        pendingRefresh = null;
      });
    return pendingRefresh;
  },

  endSession: (reason) => set({ user: null, accessToken: null, signOutReason: reason }),

  updateSession: ({ user, accessToken }) => set(accessToken ? { user, accessToken } : { user }),
}));

// Wired at import time so every request, even the first, carries the current token.
// An expired access token is renewed transparently; if that fails too, the session is over.
setTokenSource(() => useAuthStore.getState().accessToken);
setSessionRefresher(async () => (await useAuthStore.getState().refresh()) !== null);
onUnauthorized(() => useAuthStore.getState().endSession("expired"));

/** The auth state and actions components need; re-renders only when one of them changes. */
export function useAuth() {
  return useAuthStore(
    useShallow((state) => ({
      user: state.user,
      isLoading: state.isLoading,
      isAuthenticated: state.user !== null,
      signOutReason: state.signOutReason,
      login: state.login,
      logout: state.logout,
    }))
  );
}

/**
 * Calls `listener` whenever the signed-in user's session ends: logout, expiry, or another
 * tab signing in as someone else. Returns an unsubscribe function.
 */
export function onSignOut(listener: () => void): () => void {
  return useAuthStore.subscribe((state, previous) => {
    if (previous.user && state.user?.id !== previous.user.id) listener();
  });
}
