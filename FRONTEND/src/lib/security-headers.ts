/**
 * Security headers applied to every SSR response (see src/server.ts).
 *
 * CSP notes: TanStack Start streams inline hydration scripts and this app ships a tiny inline
 * theme bootstrap, so `script-src` needs 'unsafe-inline' until the router's nonce support is
 * adopted; everything else is locked down. `connect-src` allows the configured API origin (when
 * the UI and engine are on different origins) so credentialed fetches keep working.
 */
export function securityHeaders(apiOrigin?: string): Record<string, string> {
  const connect = ["'self'", ...(apiOrigin ? [apiOrigin] : [])].join(" ");
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    `connect-src ${connect}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
  return {
    "Content-Security-Policy": csp,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
  };
}

/** Returns a copy of `response` with the security headers set (never overriding an existing CSP). */
export function withSecurityHeaders(response: Response, apiOrigin?: string): Response {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(securityHeaders(apiOrigin))) {
    if (!headers.has(k)) headers.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
