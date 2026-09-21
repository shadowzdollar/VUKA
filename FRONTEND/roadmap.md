# Roadmap

- [x] Design and build a distinct enterprise landing page.
- [x] Add login and signup pages matching the VUKA visual system.
- [x] Add useful charts across the operational dashboard pages (trader overview, escrow register).
- [x] Verify desktop and mobile presentation and interactions (Chrome, 1400 px and 375 px).
- [ ] Package the complete frontend source as a downloadable ZIP.
- [x] Integrate the frontend with the Go engine (auth, ledger, invoices, workflows, disputes, compliance, settlements).
- [x] Trader-facing KYC submission.
- [x] Unify invoice-linked FX payments with the provider workflow.
- [ ] Add a frontend test runner (Vitest) and cover `src/lib/trust.ts` and `src/lib/pacs008.ts`.
- [ ] Native-speaker review of the French, Kiswahili, Portuguese and Kinyarwanda strings; add Arabic (RTL).
- [ ] Manual assistive-technology audit (NVDA, VoiceOver, TalkBack) and an external accessibility review.
- [ ] Nonce-based CSP (drop `script-src 'unsafe-inline'`).
- [ ] Extend i18n coverage from shell/auth/landing to every page.
