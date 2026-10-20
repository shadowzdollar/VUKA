# VUKA — Deploy the frontend to Vercel

Deploy the engine first (`ENGINE/deploy/RENDER_DEPLOY_RUNBOOK.md`) — this
frontend needs its URL.

## 1. Import the project

Vercel → **Add New → Project** → select this repo → set **Root Directory**
to `FRONTEND`. `vercel.json` already sets `"framework": null` and the build
command, so Vercel won't guess wrong and apply a static-Vite preset — it runs
the real build and picks up the `.vercel/output` the Nitro `vercel` preset
produces (see `vite.config.ts`: the preset is forced automatically when
`VERCEL` is set, which Vercel's own build environment sets for you).

## 2. Environment variables

Project → **Settings → Environment Variables**:

| Key | Value | Notes |
|---|---|---|
| `VITE_API_BASE_URL` | `https://<your-render-service>.onrender.com` | The engine's URL. Absolute, no trailing slash. |
| `VITE_PUBLIC_URL` | `https://<your-vercel-domain>` | Enables absolute `og:image`/`twitter:image` URLs. Set after the first deploy gives you the domain, then redeploy. |
| `VITE_ESCROW_CONTRACT` | the deployed `VukaEscrowV2` address | From the contracts deployment — see `CONTRACTS/escrow/README.md`. Leave unset until deployed; the UI will say so honestly rather than pretend. |
| `VITE_ESCROW_CHAIN_ID` | `80002` | Polygon Amoy testnet. Already the default if unset. |
| `VITE_CONTACT_EMAIL` | a real inbox | Shown on `/about`, `/security`. Until set, those pages show a visible "not yet configured" placeholder — honest, not broken. |
| `VITE_SECURITY_EMAIL` | a real inbox | Same as above, for security reports. |

Do **not** set `VUKA_API_PROXY_TARGET` — that only matters for local `npm run
dev` (it's not a `VITE_`-prefixed var, so it never reaches the browser bundle
anyway).

## 3. Close the loop with the engine

After this deploy exists, copy its Vercel URL into the Render service's
`VUKA_CORS_ORIGINS` (and confirm `VUKA_CROSS_SITE_COOKIES=true` there — see
the Render runbook). Without that, the browser will block every API call
with a CORS error, and the UI will look like it's stuck loading.

## 4. Verify

- `/` loads, the landing page's `● LIVE` market data renders (proves the
  frontend can reach the engine's `/api/public/config`).
- `/register` → create a trader account → confirm you land on the signed-in
  dashboard and a reload keeps you signed in (proves cookies are surviving
  the cross-site call — see the Render runbook's step 5 if this fails).
- Open browser devtools → Network tab → confirm `/api/*` requests go to the
  Render origin, not 404 on the Vercel domain.

## Known gap: SSR origin for server-side data loads

Some routes may fetch data during SSR (on Vercel's server, not the browser).
`VITE_API_BASE_URL` is read via `import.meta.env`, which is build-time —
inlined into both the client bundle and the server bundle at build time, so
SSR requests also target the Render engine correctly as long as the env var
is set on Vercel *before* the build runs (Vercel env vars are available at
build time by default, so this is normally automatic — just confirm after
the first deploy that a route requiring server data doesn't throw).
