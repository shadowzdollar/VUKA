/**
 * Thin fetch wrapper for the VUKA Go engine (ENGINE/go-bridge-core).
 *
 * Contract (see ENGINE/go-bridge-core/API.md):
 *  - JSON in/out; errors are always `{ "error": { "code", "message" } }`.
 *  - Sessions are HttpOnly cookies (`vuka_trader_session`, `vuka_operator_session`), so every
 *    request is sent with `credentials: "include"`.
 *  - Money-moving writes require an `Idempotency-Key` header.
 *  - `X-Request-ID` is echoed back and should be quoted when reporting a problem.
 */

const BASE = (import.meta.env["VITE_API_BASE_URL"] as string | undefined)?.replace(/\/$/, "") ?? "";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string | undefined;
  readonly body: unknown;

  constructor(status: number, code: string, message: string, requestId?: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.body = body;
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

type Query = Record<string, string | number | boolean | undefined | null>;

export interface RequestOptions {
  query?: Query;
  body?: unknown;
  idempotencyKey?: string;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Query): string {
  const url = `${BASE}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function parse(res: Response): Promise<unknown> {
  if (res.status === 204) return undefined;
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function request<T>(
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;

  let res: Response;
  try {
    const init: RequestInit = { method, headers, credentials: "include" };
    if (opts.body !== undefined) init.body = JSON.stringify(opts.body);
    if (opts.signal) init.signal = opts.signal;
    res = await fetch(buildUrl(path, opts.query), init);
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError(
      0,
      "network_error",
      "Cannot reach the VUKA engine. Check that it is running.",
    );
  }

  const requestId = res.headers.get("X-Request-ID") ?? undefined;
  const data = await parse(res);
  if (res.ok) return data as T;

  const env = (data as { error?: { code?: string; message?: string } | string } | undefined)?.error;
  if (env && typeof env === "object") {
    throw new ApiError(
      res.status,
      env.code ?? "error",
      env.message ?? res.statusText,
      requestId,
      data,
    );
  }
  throw new ApiError(
    res.status,
    typeof env === "string" ? "error" : "http_error",
    typeof env === "string" ? env : `${res.status} ${res.statusText}`,
    requestId,
    data,
  );
}

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => {
    const opts: RequestOptions = {};
    if (query) opts.query = query;
    if (signal) opts.signal = signal;
    return request<T>("GET", path, opts);
  },
  post: <T>(path: string, body?: unknown, opts: Omit<RequestOptions, "body"> = {}) =>
    request<T>("POST", path, body === undefined ? opts : { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts: Omit<RequestOptions, "body"> = {}) =>
    request<T>("PATCH", path, body === undefined ? opts : { ...opts, body }),
};

/** Download an authenticated CSV/text endpoint (activity export, dispute audit, ...). */
export async function download(path: string, filename: string, query?: Query): Promise<void> {
  const res = await fetch(buildUrl(path, query), { credentials: "include" });
  if (!res.ok) {
    const data = await parse(res);
    const env = (data as { error?: { code?: string; message?: string } } | undefined)?.error;
    throw new ApiError(res.status, env?.code ?? "http_error", env?.message ?? res.statusText);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Human-readable message that always carries the request id when the engine supplied one. */
export function describeError(e: unknown): string {
  if (isApiError(e)) return e.requestId ? `${e.message} (ref ${e.requestId})` : e.message;
  return e instanceof Error ? e.message : "Unexpected error";
}
