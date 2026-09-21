/**
 * Single choke point for errors caught by React error boundaries. Today it logs to the console and
 * emits a `vuka:error` DOM event; wire a monitoring client (Sentry, OpenTelemetry, ...) by listening
 * for that event, so no vendor is baked into the app. Remember that `connect-src` in the CSP
 * (src/lib/security-headers.ts) must allow the monitoring endpoint.
 */
export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  // Loaders and server functions sometimes throw a raw Response; String() of one is "[object Response]".
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);
  const detail = {
    message,
    stack: error instanceof Error ? error.stack : undefined,
    route: window.location.pathname,
    ...context,
  };
  console.error("[vuka] unhandled UI error:", detail);
  window.dispatchEvent(new CustomEvent("vuka:error", { detail }));
}
