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
};

/** i18n key for why a login attempt failed. */
export function loginErrorKey(err: unknown): string {
  // 400: rejected by validation, 401: wrong password, 404: unknown email.
  const badCredentials = err instanceof ApiError && [400, 401, 404].includes(err.status);
  return badCredentials ? "login.invalidCredentials" : "login.genericError";
}
