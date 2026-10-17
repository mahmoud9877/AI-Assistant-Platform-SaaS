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

// Sends the request with the current access token; on 401 renews the session once and retries.
async function authorizedFetch(path: string, { method = "GET", body, auth = true }: RequestOptions): Promise<Response> {
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

  const res = await send();
  // The access token is short-lived: on 401, renew the session once and retry.
  if (res.status === 401 && auth && (await sessionRefresher?.())) return send();
  return res;
}

// Reads the body of a response; throws an ApiError for a non-2xx status.
async function readResponse(res: Response, auth: boolean): Promise<unknown> {
  // 204 No Content has no body to parse, whatever its headers say.
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data: unknown = res.status === 204 ? undefined : isJson ? await res.json() : await res.text();

  if (!res.ok) {
    if (res.status === 401 && auth) unauthorizedHandler?.();
    throw new ApiError(errorMessage(data, res.status), res.status);
  }
  return data;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await authorizedFetch(path, options);
  return (await readResponse(res, options.auth ?? true)) as T;
}

/**
 * Calls an endpoint that answers with Server-Sent Events, passing each event's name and
 * parsed JSON data to `onEvent` as it arrives. Resolves when the stream ends. An error
 * status before the stream starts throws an ApiError, like apiRequest.
 */
export async function apiStream(
  path: string,
  options: RequestOptions,
  onEvent: (event: string, data: unknown) => void
): Promise<void> {
  const res = await authorizedFetch(path, options);
  if (!res.ok || !res.headers.get("content-type")?.includes("text/event-stream") || !res.body) {
    await readResponse(res, options.auth ?? true);
    throw new ApiError("The server did not start a stream.", res.status);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += value;
    // Events are separated by a blank line; the last piece may still be incomplete.
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";
    for (const block of blocks) {
      let event = "message";
      let data = "";
      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (data) onEvent(event, JSON.parse(data));
    }
  }
}
