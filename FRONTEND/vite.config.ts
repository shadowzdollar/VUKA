import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// The Go engine authenticates with HttpOnly session cookies. Proxying /api through the dev
// server keeps the browser same-origin, so cookies work without any CORS configuration.
// Override with VUKA_API_PROXY_TARGET when the engine is not on localhost:8080.
const engine = process.env["VUKA_API_PROXY_TARGET"] ?? "http://localhost:8080";

export default defineConfig(({ command }) => ({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    dedupe: ["react", "react-dom", "@tanstack/react-query", "@tanstack/query-core"],
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    // Redirects TanStack Start's server entry to src/server.ts (SSR error wrapper + security headers).
    tanstackStart({ server: { entry: "server" } }),
    // Production server bundle. Nitro picks a Node server by default; set NITRO_PRESET to target
    // another platform (e.g. "cloudflare-module", "vercel", "bun").
    ...(command === "build" ? [nitro()] : []),
    viteReact(),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: engine, changeOrigin: true },
      "/healthz": { target: engine, changeOrigin: true },
      "/readyz": { target: engine, changeOrigin: true },
    },
  },
}));
