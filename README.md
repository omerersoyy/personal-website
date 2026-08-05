# tessergames.com

The Tesser site. Astro, static output, plain CSS, no UI framework.

The three spec documents in this repo are the source of truth and are read in
order: `00-FOUNDATION.md` (system), `01-PAGES.md` (routes and copy),
`02-MIGRATION-LAUNCH.md` (migration and launch).

## Commands

```bash
npm install
npm run dev      # localhost:4321
npm run build    # → dist/
npm run preview
npm run check    # astro check
```

## What exists

Phase `00-FOUNDATION` is in place:

- Design tokens (`src/styles/tokens.css`) — the only place colours are defined
- Base layout with head/meta/OG, header and footer
- All nine components from §8, plus `fold-reveal.js` and `copy-email.js`
- `games` content collection with both entries stubbed
- A placeholder home page that exercises the components end to end

Routes from `01-PAGES.md` (`/play`, `/games/[slug]`, `/press`, `/support`,
`/privacy/[slug]`) are the next phase.

## Deviations from the spec, and why

- **Content config lives at `src/content.config.ts`**, not `src/content/config.ts`.
  The spec's path is the pre-Astro-5 layout; Astro 7 uses the Content Layer
  API. The entries themselves are still in `src/content/games/`.
- **Brand SVGs are inlined from `src/brand/`** rather than redrawn. They are
  copies of `tesser-brand/`; regenerate them there, not here.

## Placeholders to replace before launch

- `public/badges/` — official Apple and Google badge artwork (see the README
  there). Until a file is present, `StoreBadges` renders a plain text link.
- `public/games/*/cover.webp` — solid-colour placeholders
- Store URLs in `src/content/games/*.md`
- Loop videos, screenshots, and the long descriptions in both game entries
