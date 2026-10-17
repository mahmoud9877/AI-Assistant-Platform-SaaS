export const LOGIN_PATH = "/";
export const DEFAULT_AFTER_LOGIN = "/home";

/** Only same-site paths are allowed as a post-login destination (no `//evil.com`). */
export function safeNextPath(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") && next !== LOGIN_PATH ? next : DEFAULT_AFTER_LOGIN;
}

/** The login URL that brings the user back to `path` afterwards. */
export function loginUrlFor(path: string): string {
  return path && path !== LOGIN_PATH && path !== DEFAULT_AFTER_LOGIN
    ? `${LOGIN_PATH}?next=${encodeURIComponent(path)}`
    : LOGIN_PATH;
}
