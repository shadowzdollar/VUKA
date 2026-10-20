# VUKA — Deploy the engine to Render

**Current architecture (supersedes the single-service hackathon-era version of
this doc):** the frontend (`FRONTEND/`, TanStack Start) deploys separately to
**Vercel** and calls this engine **cross-origin**. This Render service is
API-only — it does not build or serve the SPA. See
`FRONTEND/VERCEL_DEPLOY.md` for the frontend half, and deploy the engine
first: the frontend's `VITE_API_BASE_URL` needs this service's URL.

## Why `VUKA_ENV=development` in a public deployment

This is intentional, not a mistake. `internal/config/config.go` refuses to
boot with `VUKA_ENV=production` unless `VUKA_READ_ONLY=true` and local
synthetic execution is **off** — because "production" in this codebase means
real licensed payout rails, which VUKA does not have (see `AGENTS.md`:
never claim licensing, audits, live rails, or endorsement). Setting
`VUKA_ENV=production` on a public demo would make every registration,
payment, and invoice fail with a read-only error. Running as `development`
with `VUKA_LOCAL_SYNTHETIC_EXECUTION_ENABLED=true` is what keeps the sandbox
genuinely interactive — and the UI already labels it a sandbox everywhere, so
this is honest, not a workaround.

## 1. Deploy the Blueprint

1. Push this repo to GitHub/GitLab (public or Render-connected private repo).
2. Render → **New → Blueprint** → select the repo → it reads
   `ENGINE/deploy/render.yaml` and provisions:
   - `vuka-engine` — a Docker web service (`ENGINE/deploy/Dockerfile`)
   - `vuka-db` — a free Postgres (90-day expiry; swap to Neon/Supabase for a
     non-expiring DB — see Option B below)
3. Render builds and deploys. First build takes a few minutes (Go compile).

## 2. Fill in the `sync: false` secrets

In the Render dashboard → `vuka-engine` → **Environment**, set:

| Key | Value |
|---|---|
| `VUKA_QUOTE_SIGNING_KEY` | `openssl rand -hex 32` (≥ 32 chars, same value on every replica) |
| `VUKA_OPERATOR_EMAIL` | a real address you control, e.g. `operator@yourdomain.example` |
| `VUKA_OPERATOR_PASSWORD` | a strong password, ≥ 12 chars — this is a real login, not a demo seed |

## 3. Point it at the Vercel frontend

Once the Vercel deploy exists (step requires this engine's URL first — do
this after both are up, then redeploy if needed):

- `VUKA_CORS_ORIGINS` → the Vercel production URL (and preview URL if you
  want previews to work too), comma-separated, no trailing slash.
- `VUKA_CROSS_SITE_COOKIES` is already `true` in the blueprint — required
  because Vercel and Render are different sites, so session cookies must be
  `SameSite=None` to survive the cross-origin `fetch`. Leaving this `false`
  (the engine's default) makes login *appear* to succeed — the cookie is set —
  but silently drops on every following request, so the app looks logged out.

## 4. Seed demo data (optional, recommended for evaluators)

```bash
# from ENGINE/go-bridge-core, pointing at the Render DB's external connection string
export VUKA_DATABASE_URL="postgres://vuka:***@<render-host>/vuka?sslmode=disable"
go run ./cmd/seed
```

Other seeders in `cmd/seed-*` add disputes, settlements, analytics history,
identity/KYC cases, and a supervised pilot trail — run the ones relevant to
what you want an evaluator to see. The "development demo access" quick-login
panel on `/login` only appears when `config.environment == "development"`,
which it will be with the settings above.

## 5. Verify

- `{SERVICE_URL}/healthz` → 200
- `{SERVICE_URL}/api/public/config` → 200, JSON with `countries`/`environment`
- From the deployed Vercel frontend: register a trader, log in, confirm the
  session persists across a page reload (this specifically exercises the
  cross-site cookie fix — if it silently logs you out after one request,
  re-check `VUKA_CROSS_SITE_COOKIES` and `VUKA_CORS_ORIGINS`).

## Option B — bring your own Postgres (avoids the 90-day free-tier expiry)

1. Create a Neon (recommended, perpetual free tier) or Supabase project.
2. In `render.yaml`, delete the `databases:` block and the `fromDatabase`
   stanza under `VUKA_DATABASE_URL`; set `VUKA_DATABASE_URL` directly in the
   dashboard to the external DSN (`sslmode=require` for Neon).

## Render free-tier caveats

- The web service spins down after ~15 min idle; first request after that
  takes ~30–60s to wake. Fine for a reviewed demo, not for a timed live
  walkthrough — consider a paid instance or a keep-alive ping before a
  scheduled presentation.
- Free Postgres expires after ~90 days (see Option B).
- 750 free instance-hours/month.

## Optional: the Python ISO 20022 gateway

`ENGINE/python-iso-gateway` is a pacs.008 → pacs.002 translator for bank/
telecom-side integration testing — it is a separate interoperability surface,
not something the trader/operator web app calls. It is not required for the
live site to work. Deploy it only if you have an external system that needs
to exchange real ISO 20022 messages against this engine's gRPC port.
