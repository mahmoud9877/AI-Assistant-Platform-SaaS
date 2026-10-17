export const API_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:5000";

// Prefix of the authorization header; the backend's BEARER_KEY.
const BEARER_KEY = process.env.NEXT_PUBLIC_BEARER_KEY ?? "employee";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let unauthorizedHandler: (() => void) | null = null;
let tokenSource: () => string | null = () => null;
let sessionRefresher: (() => Promise<boolean>) | null = null;

/** Tells the client where to read the access token from (set by the auth feature). */
export function setTokenSource(source: () => string | null): void {
  tokenSource = source;
}

/** Gets a new access token after a 401; resolves false when the session can't be renewed. */
export function setSessionRefresher(refresher: (() => Promise<boolean>) | null): void {
  sessionRefresher = refresher;
}

/** Called when an authenticated request is still 401 after trying to refresh the session. */
export function onUnauthorized(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

/** Turns a stored path like `/uploads/x.png` into a full URL. */
export function assetUrl(path: string | null | undefined): string | undefined {
  return path ? `${API_URL}${path}` : undefined;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
}

// The backend reports errors as { message }, { error } or a Joi { validationErr } list.
function errorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const data = body as { message?: string; error?: string; validationErr?: { message: string }[] };
    if (data.validationErr?.length) return data.validationErr.map((e) => e.message).join(", ");
    if (data.error) return data.error;
    if (data.message) return data.message;
  }
  return `Request failed (${status})`;
}

export async function apiRequest<T>(path: string, { method = "GET", body, auth = true }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  // Read the token per attempt so a retry carries the refreshed one.
  const send = () => {
    if (auth) headers.authorization = `${BEARER_KEY}${tokenSource() ?? ""}`;
    // credentials: the refresh-token cookie must be sent to, and accepted from, the API origin.
    return fetch(`${API_URL}${path}`, { method, headers, body: payload, credentials: "include" });
  };

  let res = await send();
  // The access token is short-lived: on 401, renew the session once and retry.
  if (res.status === 401 && auth && (await sessionRefresher?.())) {
    res = await send();
  }

  // 204 No Content has no body to parse, whatever its headers say.
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data: unknown = res.status === 204 ? undefined : isJson ? await res.json() : await res.text();

  if (!res.ok) {
    if (res.status === 401 && auth) unauthorizedHandler?.();
    throw new ApiError(errorMessage(data, res.status), res.status);
  }
  return data as T;
}
