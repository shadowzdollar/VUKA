# VUKA frontend — working notes

- Stack: TanStack Start (SSR) + React 19 + Tailwind 4 + shadcn/ui. Build config is plain `vite.config.ts`; there is no hosted-editor tooling.
- Design rules live in `frontend_color_guidelines.md` (monochrome; state is carried by weight and fill, never hue) — national flags are the only coloured imagery.
- The engine is the source of truth for fees, rates, limits and fee groups; never hard-code them in the UI.
- Sandbox honesty: do not claim licensing, audits, live rails, or endorsement by any institution.
- Before finishing a change: `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- Git: do not rewrite published history.
