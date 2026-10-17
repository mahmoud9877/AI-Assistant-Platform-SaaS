import { ApiError, apiRequest } from "@/lib/api-client";
import type { User } from "./types";

/** The refresh token never reaches JavaScript: the backend sets it as an httpOnly cookie. */
interface SessionResponse {
  accessToken: string;
  user: User;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<SessionResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    }),

  /** Trades the refresh-token cookie for a new access token (and a rotated cookie). */
  refresh: () => apiRequest<SessionResponse>("/auth/refresh", { method: "POST", auth: false }),

  /** Revokes the refresh token and clears its cookie. */
  logout: () => apiRequest<void>("/auth/logout", { method: "POST", auth: false }),

  signup: (email: string, password: string, name: string) =>
    apiRequest<{ userId: number }>("/auth/signup", { method: "POST", body: { email, password, name }, auth: false }),

  /** Emails a reset link if the address has an account; the answer is the same either way. */
  forgotPassword: (email: string) =>
    apiRequest<{ message: string }>("/auth/forgot-password", { method: "POST", body: { email }, auth: false }),

  resetPassword: (token: string, password: string) =>
    apiRequest<void>("/auth/reset-password", { method: "POST", body: { token, password }, auth: false }),

  /** Signs out every other device; returns a fresh session for this one. */
  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest<SessionResponse>("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } }),

  updateProfile: async (name: string) =>
    (await apiRequest<{ user: User }>("/auth/me", { method: "PATCH", body: { name } })).user,
};

/** i18n key for why a login attempt failed. */
export function loginErrorKey(err: unknown): string {
  // 400: rejected by validation, 401: wrong password, 404: unknown email.
  const badCredentials = err instanceof ApiError && [400, 401, 404].includes(err.status);
  return badCredentials ? "login.invalidCredentials" : "login.genericError";
}
