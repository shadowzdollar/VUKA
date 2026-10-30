# VUKA Frontend Color Guidelines

> **Superseded 2026-10-29.** At the user's explicit request, the frontend moved from this strict
> monochrome palette to an off-white/ink/electric-lime system (see `FRONTEND/AGENTS.md` and the
> `project-vuka-design-system` memory). The actual palette now lives as semantic tokens in
> `FRONTEND/src/styles.css` — that file is the source of truth, not the hex values below. The
> underlying principle this doc argues for — state carried by weight/fill/position, not color
> alone — still applies; only the base palette itself has changed.

## Palette

| Token | Hex | Use |
|---|---|---|
| Ink | `#0A0A0A` | Primary text, headers, filled backgrounds |
| Paper | `#FFFFFF` | Base background |
| Ink 70% | `#4A4A4A` | Secondary text, sub-labels |
| Ink 40% | `#8A8A8A` | Muted/placeholder text, disabled states |
| Ink 15% | `#D6D6D6` | Hairline borders, dividers, table rules |
| Paper Shade | `#F2F2F2` | Subtle section backgrounds, hover states, alternating rows |

No other colors anywhere in the interface — no blue, no green, no red/rust. Everything is black, white, and the opacity steps between them.

## Application Rules

**Backgrounds**
- Default page/app background: Paper (`#FFFFFF`)
- Sidebar, subtle section separation, table hover/alternating rows: Paper Shade (`#F2F2F2`)
- Never stack more than one grey tone in the same view without a clear hierarchy reason (e.g. sidebar vs. main content is fine; three different greys competing on one card is not)

**Text**
- Primary content, headings, amounts: Ink (`#0A0A0A`)
- Secondary text (descriptions, timestamps, helper text): Ink 70% (`#4A4A4A`)
- Muted/placeholder/disabled text: Ink 40% (`#8A8A8A`)
- Never use pure black on pure white for large blocks of body text if it feels too harsh in testing — Ink 70% is the fallback for body copy, Ink 100% reserved for headings and key numbers

**Borders & Dividers**
- All hairlines, table row dividers, input borders: Ink 15% (`#D6D6D6`)
- Never use a darker grey for borders than for muted text — borders should always recede behind content

**Escrow / Status States** (text-only, weight and fill carry meaning — no color)
- **Locked** — Ink 15% border, transparent fill, Ink text
- **Released** — Ink fill, Paper text (inverted — the "stamped" look)
- **Disputed** — thicker Ink border (roughly 2x weight of Locked's border), transparent fill, Ink text

**Interactive States**
- Default button (primary action): Ink fill, Paper text
- Secondary/outline button: Ink 15% border, Ink text, transparent fill
- Hover on any element: shift background to Paper Shade, or invert fill-to-outline (never introduce a new color for hover)
- Focus (keyboard navigation): a visible Ink outline ring — do not rely on color alone, use offset + border for visibility

**Numbers & Amounts**
- Always Ink (`#0A0A0A`), never a muted tone, regardless of surrounding context — amounts are the most important content on the page and should never recede

## What to Avoid
- Any hue (blue, green, red, etc.) anywhere, including in charts, icons, or illustrations
- Using color to distinguish escrow states — weight/fill does that job instead
- Introducing a "success green" or "error red" for form validation — use Ink weight/border changes and text messaging instead
- Gradients of any kind
- More than the six defined tokens above
