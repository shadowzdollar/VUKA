# VUKA — web app

The web front end for VUKA ("Rise & Cross Over"), a cross-border payment platform for African SMEs:
invoice-linked payments, escrow, a double-entry ledger and mobile-money payouts. It talks to the Go engine in
`../ENGINE/go-bridge-core`. Everything runs against **sandbox rails** today; see the honesty notes below.

Stack: TanStack Start (SSR), React 19, Tailwind 4, shadcn/ui, recharts. Production output is a Nitro server
(`npm run build`); set `NITRO_PRESET` to target a platform other than plain Node.

## Backend integration

The UI talks to the Go engine in `ENGINE/go-bridge-core` (contract: `ENGINE/go-bridge-core/API.md`).
There are two independent sign-ins, each with its own HttpOnly cookie, and the navigation and pages adapt:

| Identity | Sign in with | Sees |
| --- | --- | --- |
| Trader | mobile number + password | overview, wallets & ledger, send payment, invoices, trust score, verification & limits, corridors, support |
| Operator / arbiter | email + password | cockpit, escrow register, disputes, compliance, providers, settlements & pilots, activity log |

Traders can self-register at `/register`. Operators are provisioned by the platform team.

```
src/lib/api/client.ts      fetch wrapper: cookies, error envelope, Idempotency-Key, downloads
src/lib/api/types.ts       wire types mirroring the engine's JSON
src/lib/api/endpoints.ts   one typed function per engine endpoint, grouped by surface
src/lib/session.tsx        trader/operator session context + logout
src/lib/trust.ts           trust score computed from the trader's own ledger history
```

### Run it locally

```sh
# 1. database + engine (from ENGINE/)
cp deploy/.env.example deploy/.env      # set POSTGRES_PASSWORD etc.
make up && make demo-seed               # Postgres on :5433 + demo traders
# run the engine with the dev settings the demo uses:
set -a; . deploy/.env; set +a
cd go-bridge-core
VUKA_FX_RWF_KES=9.5 MTN_SIM_MODE=success VUKA_CORS_ORIGINS=http://localhost:5173 go run ./cmd

# 2. the UI
cd FRONTEND && npm i && npm run dev     # http://localhost:5173
```

Demo traders (password `vuka-demo-2026`): `+250700000991` (Amina, RWF), `+254700000882` (Kethan, KES),
`+250700000773` (Jean-Paul, RWF). Operator credentials are `VUKA_OPERATOR_EMAIL` / `VUKA_OPERATOR_PASSWORD`;
`make seed-dispute` adds an arbiter, an approver and a synthetic dispute.

Dev requests to `/api` and `/healthz` are proxied to the engine so cookies stay same-origin. See `.env.example`
for the variables.

> Never point the Go test suite at your dev database: its helpers `TRUNCATE` tables. Use a separate
> `vuka_test` database.

## Enterprise frontend

**Design system.** Semantic tokens in `src/styles.css` (oklch), a light "paper" theme per
`frontend_color_guidelines.md` and a dark theme, chosen by a stored preference or the OS setting and applied
before first paint (no flash). Strictly monochrome: state is carried by weight, fill and text, never hue.
Shared building blocks live in `src/components/vuka/` (`Shell`, `Panel`, `Metric`, `Chip`, `DataTable`,
`QueryBoundary`, lazy charts); pages compose them rather than restyling.

**Layout & responsiveness.** Sidebar navigation on desktop, drawer on mobile, command palette (⌘/Ctrl-K),
account menu (theme, language, sign-out), unread-notification bell. `DataTable` collapses each row into a
labelled card below `md`, so no page needs horizontal scrolling at 375 px.

**Accessibility (WCAG 2.1 AA target).** Skip link, landmarks, route-change announcements with focus moved to
`<main>`, one high-contrast focus ring, `prefers-reduced-motion`, keyboard-operable table rows, real table
semantics with captions and `aria-sort`, labelled controls, chart data exposed as sr-only tables. An automated
axe-core pass (WCAG 2 A/AA + 2.1 A/AA) over every page in both themes reports **zero violations**; automated
checks catch only part of WCAG, so manual screen-reader testing (NVDA, VoiceOver, TalkBack) is still required
before launch.

**Internationalisation.** `src/lib/i18n.tsx`: English, French, Kiswahili, Portuguese, Kinyarwanda with
per-key English fallback. Covered today: navigation, shell, sign-in/registration, landing. The non-English
strings are first-pass and **need review by native, finance-literate speakers**; Arabic (RTL) is not yet included.

**Security.** SSR responses carry a CSP, `frame-ancestors 'none'`, `nosniff`, HSTS, a strict referrer and
permissions policy (`src/lib/security-headers.ts`); `script-src` still needs `'unsafe-inline'` for framework
hydration until nonce support is adopted. No `dangerouslySetInnerHTML`. Sessions are HttpOnly cookies; all
cached data is cleared on sign-out; an idle guard warns then signs out after 15 min on shared devices.
Verification documents are fingerprinted (SHA-256) **in the browser and never uploaded**. Amounts are parsed
with strict decimal rules (`src/lib/schemas.ts`), never `Number()` on free text.

**Performance.** Route-level code splitting (30 chunks), link-intent preloading, lazy-loaded charts (~97 KB gzip
kept off the critical path), entry bundle ≈ 134 KB gzip, skeletons instead of layout-shifting spinners,
5-minute caching of the public config.

**Analytics.** `/analytics` is role-aware. Traders get *Insights* (money in/out trend, reliability gauge,
currency and outcome donuts, payment-size histogram, top counterparties, corridor flow matrix, activity
heatmap, plain-language observations). Operators get *Network Intelligence* (throughput, corridor matrix,
verification funnel, rail reliability, workflow states, support and settlement load). The trust page adds a
radar and a "path to a higher score" that prices each lever in points from the published formula. Charts are
monochrome, lazy-loaded, and each has an sr-only data table. Aggregation is server-side
(`ENGINE/.../internal/analytics`). To see realistic data locally run `go run ./cmd/seed-analytics` (dev only;
refuses production).

**Verification.** `npx tsc --noEmit`, `npm run lint` (0 errors) and `npm run build` are clean. The browser
suite used during development drives real Chrome against a live engine: landing, security headers, i18n, theme,
palette, keyboard flows, mobile overflow, KYC hashing, FX payment, KYC-limit refusal, plus the axe scan.

## Public site: landing, sign-in, registration

Design language for the signed-out surface: editorial serif display type (Newsreader, with Georgia fallback),
engraved cartography and paper stacks, still monochrome apart from national flags. Deliberately not "futuristic".
Everything below is in `src/components/vuka/landing/` unless noted.

- **Landing** (`landing.tsx`): hero with an interactive canvas globe (real Natural Earth borders, corridor arcs,
  drag/inertia, lazy-loaded), a **public cost estimator** backed by `GET /api/public/estimate` (with share sheet
  / WhatsApp link), a 3D paper-stack payment journey, an **escrow lab** (four scenarios with the contract's exact
  rules), a **mobile section** (3D phone: press-and-hold confirmation, weak-signal idempotent retries, a USSD
  concept driven by live pricing, share/install; data-saver toggle and a measured page-weight meter), bento
  features, a **trust-score lab** (client mirror of the published formula), the **atlas of markets** (papercut Africa
  map with flag-printed markets, planted flag pins, passport-stamp selector, fee groups from the engine's public
  config), a framework timeline, illustrative stories, comparison table, FAQ, CTA and a five-column footer.
- **Flags** (`flags.tsx`): ten hand-drawn SVG flags with simplified emblems, no network requests. The African Union
  emblem is deliberately **not** reproduced, and the framework seals are generic, not official.
- **Sign-in / registration**: split-screen frame with a 3D receipt; sign-in has show/hide password, Caps Lock
  warning, and a dev-only demo-access card shown only when the engine reports `environment=development`; the
  register page is a four-step wizard (account type, details with country-aware phone entry, password strength +
  consent, review) ending in a welcome screen with the PENDING-tier limits from the public config.
- **Public pages**: `/about` (principles, roadmap, accessibility statement), `/security` (controls in place *and*
  what is not done), `/status` (live probes), `/privacy` (with a table of every browser-storage key), `/terms`.
  Privacy and terms are **drafts pending legal review**. Contact addresses come from `VITE_CONTACT_EMAIL` and
  `VITE_SECURITY_EMAIL`; until set, the pages show a visible "not yet configured" placeholder.
- **Mobile**: web manifest (`public/manifest.webmanifest`, SVG icon) and theme-colour meta. There is no service
  worker, so it is installable but **not offline-capable**. The USSD screen is a concept; a real channel needs a
  telecom shortcode agreement (`*000#` is a placeholder).
- **Honesty rules**: personas are labelled composite/illustrative; nothing claims licensing, audit, or AU
  endorsement; fees and rates on the page come from the engine, not hard-coded.
- **Tested** with real Chrome + axe (WCAG 2/2.1 A/AA): zero violations on the landing page (light, dark, 375 px),
  the five public pages, sign-in and each registration step; keyboard, reduced-motion and touch paths covered.
  Google Fonts is the one third-party request (disclosed in `/privacy`); self-hosting is planned.

### Things the engine does not provide (and how the UI copes)

- **Escrow contract address.** Escrow, dispute and reconciliation reads need `?contract=`; operators enter it once
  (or set `VITE_ESCROW_CONTRACT`). Without `VUKA_RECONCILIATION_ENABLED` on the engine those pages say so.
- **Trust score, KYC submission, limits, public config.** Now served by the engine
  (`/api/trader/trust-score`, `/api/trader/kyc`, `/api/trader/limits`, `/api/config/public`).
- **Kill switches.** Deployment configuration, shown read-only.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```



some links

https://www.pornhub.com/view_video.php?viewkey=ph5e12534b5874a
https://www.pornhub.com/view_video.php?viewkey=66f41ef6d2acf






plan,
 develop,
  test,
   review ,
    repeat