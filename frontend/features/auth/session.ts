// Login/logout signals shared between tabs, and cleanup of the pre-cookie session storage.
// The access token itself lives in the auth store's memory (see store.ts).

const CHANNEL = "eve-auth";
export type AuthEvent = "login" | "logout";

// Before refresh tokens, the user and token were kept in localStorage.
const LEGACY_KEYS = ["token", "eve-user"];

export const session = {
  /** Tells the other open tabs that this tab logged in or out. */
  broadcast(event: AuthEvent): void {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage(event);
    channel.close();
  },

  /** Calls `listener` when another tab logs in or out. */
  onExternalChange(listener: (event: AuthEvent) => void): () => void {
    if (typeof BroadcastChannel === "undefined") return () => {};
    const channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (message: MessageEvent<AuthEvent>) => listener(message.data);
    return () => channel.close();
  },

  removeLegacyStorage(): void {
    try {
      LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Storage is blocked, so nothing was stored there either.
    }
  },
};
