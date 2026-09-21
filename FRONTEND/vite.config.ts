// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// The Go engine authenticates with HttpOnly session cookies. Proxying /api through the dev
// server keeps the browser same-origin, so cookies work without any CORS configuration.
// Override with VUKA_API_PROXY_TARGET when the engine is not on localhost:8080.
const engine = process.env["VUKA_API_PROXY_TARGET"] ?? "http://localhost:8080";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    server: {
      proxy: {
        "/api": { target: engine, changeOrigin: true },
        "/healthz": { target: engine, changeOrigin: true },
      },
    },
  },
});
