# VUKA frontend — working notes

- Stack: TanStack Start (SSR) + React 19 + Tailwind 4 + shadcn/ui. Build config is plain `vite.config.ts`; there is no hosted-editor tooling.
- Design system (2026-10-29 update, superseding the monochrome rule in `frontend_color_guidelines.md`): off-white/ink/electric-lime, defined as semantic tokens in `src/styles.css` (`--background`, `--primary`, `--chart-*`, `--hero-*`, etc.) — adopted at the user's explicit request to match a reference design ("new-fronted"). Always use the tokens (`bg-primary`, `text-muted-foreground`, …), never hardcoded hex — the whole app (including every dashboard chart) re-themes from `styles.css` alone. National flags remain the only imagery exempt from the token system.
- The engine is the source of truth for fees, rates, limits and fee groups; never hard-code them in the UI.
- Sandbox honesty: do not claim licensing, audits, live rails, or endorsement by any institution.
- Before finishing a change: `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- Git: do not rewrite published history.
