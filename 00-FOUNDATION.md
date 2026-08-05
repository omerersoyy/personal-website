# Tesser site — 00 · Foundation

> First of three spec documents. The other two (`01-PAGES.md`, `02-MIGRATION-LAUNCH.md`) **assume you have read this one.** If you are starting a fresh session, read this first.

---

## 1. Context

Tesser is a one-person game studio. Two games shipped or shipping (Beaster, inout parkour), two more planned. This site is the brand's home: game pages, privacy policies, support, press kit.

**What the site has to do, in one sentence:** someone saw a clip, wondered who made it — they should find the answer in ten seconds and install the game.

### The idea the site must carry

Both games are built on one thing: **getting to the other side of a wall without walking around it.** The brand came from that (a folded card, a broken S). The site must come from the same place — not from decoration.

This is the concrete meaning of "must not look AI-generated": every visual decision on this site derives from the work. Gradients, glassmorphism, spinning spheres, glow — none of them belong here.

---

## 2. Technology decisions (not up for debate)

| Decision | Value | Why |
|---|---|---|
| Framework | **Astro** (latest) | Static output, zero JS by default |
| UI library | **None.** No React/Vue/Svelte | Unnecessary weight for a 5-page static site |
| Styling | **Plain CSS** with custom-property tokens | No Tailwind; the token set is small |
| Hosting | **Cloudflare Pages** | Free, deploys on git push |
| Domain | `tessergames.com` (Cloudflare Registrar) | |
| Email | Cloudflare Email Routing → `support@`, `hello@` | |
| Analytics | **Cloudflare Web Analytics** | Cookieless, no consent banner needed |
| Fonts | `@fontsource/space-grotesk`, `@fontsource/jetbrains-mono` — **self-hosted** | No requests to Google Fonts |
| Icons | None. Inline SVG where unavoidable | No icon library |

### Client JS budget

**Under 8 KB gzipped, total.** The only client-side code allowed:

1. `fold-reveal.js` — the pointer mask (see §7.1)
2. `copy-email.js` — copy-to-clipboard on the press page

Nothing else ships JS. If something seems to need JS, check whether CSS can do it first.

---

## 3. Setup and file tree

```bash
npm create astro@latest tesser-site -- --template minimal --typescript strict
cd tesser-site
npm i @fontsource/space-grotesk @fontsource/jetbrains-mono
```

```
tesser-site/
├─ public/
│  ├─ favicon.svg
│  ├─ favicon.ico
│  ├─ apple-touch-icon-180.png
│  ├─ og-1200x630.png
│  ├─ badges/                   # official App Store / Google Play badges
│  ├─ press/                    # downloadable press kit files
│  └─ games/
│     ├─ beaster/               # screenshots, loop video, cover, icon
│     └─ inout-parkour/
├─ src/
│  ├─ styles/
│  │  ├─ tokens.css             # §4 — single source of truth
│  │  └─ global.css             # reset + base typography
│  ├─ layouts/
│  │  └─ Base.astro             # <head>, meta, header, footer
│  ├─ components/
│  │  ├─ Mark.astro
│  │  ├─ Lockup.astro
│  │  ├─ FoldCard.astro
│  │  ├─ FoldReveal.astro
│  │  ├─ GameCard.astro
│  │  ├─ StoreBadges.astro
│  │  ├─ SectionRule.astro
│  │  ├─ TesseraGrid.astro
│  │  └─ Prose.astro
│  ├─ content/
│  │  ├─ config.ts              # games collection schema
│  │  └─ games/
│  │     ├─ beaster.md
│  │     └─ inout-parkour.md
│  ├─ scripts/
│  │  ├─ fold-reveal.js
│  │  └─ copy-email.js
│  └─ pages/
│     ├─ index.astro
│     ├─ play/index.astro
│     ├─ play/[slug].astro
│     ├─ games/[slug].astro
│     ├─ press.astro
│     ├─ support.astro
│     └─ privacy/[slug].astro
└─ astro.config.mjs             # site: 'https://tessergames.com'
```

All site-facing copy is written in **English**.

---

## 4. Design tokens

`src/styles/tokens.css` — **the only place colors are defined.** No raw hex values in components.

```css
:root{
  /* Colour — green is identity, purple is interaction */
  --c-green:        #3EE68A;   /* mark, brand surfaces */
  --c-green-dark:   #1E9A5C;   /* right half of the fold */
  --c-accent:       #8B5CF6;   /* links, buttons, hover, selected state */
  --c-accent-soft:  #6D45C9;   /* accent hover / pressed */
  --c-ink:          #0C0F13;   /* page background */
  --c-surface:      #14181E;   /* cards */
  --c-surface-2:    #1B2129;   /* card hover */
  --c-line:         #242A31;   /* rules and borders */
  --c-paper:        #F2F4F6;   /* body text */
  --c-mist:         #8A9099;   /* secondary text */

  /* Type */
  --f-sans: "Space Grotesk", system-ui, sans-serif;
  --f-mono: "JetBrains Mono", ui-monospace, monospace;

  --t-hero:    clamp(2.5rem, 6vw, 4.5rem);
  --t-h1:      clamp(2rem, 4.5vw, 3rem);
  --t-h2:      clamp(1.375rem, 2.5vw, 1.75rem);
  --t-body-lg: 1.125rem;
  --t-body:    1rem;
  --t-small:   0.8125rem;

  /* Spacing — 4px base */
  --s-1: .25rem;  --s-2: .5rem;   --s-3: .75rem;  --s-4: 1rem;
  --s-6: 1.5rem;  --s-8: 2rem;    --s-12: 3rem;   --s-16: 4rem;
  --s-24: 6rem;   --s-32: 8rem;

  /* System constants */
  --fold-angle: 17deg;   /* §6 — the mark's fold angle; the site's only slope */
  --fold-rise: 14px;     /* how far the folded edge rises */
  --radius: 16px;
  --radius-lg: 24px;
  --measure: 68ch;       /* max line length for text */
  --wrap: 1080px;        /* content width */
}
```

### Type rules

- Headings: Space Grotesk 500 or 700. **Never 300 or 400 for headings.**
- Body: Space Grotesk 400, line-height 1.65, `max-width: var(--measure)`.
- Mono (JetBrains Mono) appears in exactly three places: version/date metadata, technical labels, press-kit file listings.
- The wordmark's 0.30 em tracking belongs **to the logo only.** Never repeat it in headings.

---

## 5. Colour rules

- **Green**: the mark, brand surfaces, "new" badges. Never a text colour.
- **Purple**: links, buttons, hover, `:focus-visible` ring, selected tab. Nothing non-interactive is purple.
- Green and purple are **never used as two adjacent surfaces.** The two halves of the fold are always two values of the same hue.
- Game screenshots are the most colourful thing on any page. Nothing framing them is coloured — only a `--c-line` rule or a `--c-surface` background.
- Focus is always visible: `outline: 2px solid var(--c-accent); outline-offset: 3px`.

---

## 6. The 17° rule — the site's signature

The mark's fold angle is the only slope repeated across the site. The goal is for the eye to read it as a system, not an accident.

**Use it here, and only here:**

1. Top and bottom edges of cards (`FoldCard`)
2. Section rules (`SectionRule`)
3. The bottom edge of the game-page hero
4. The press-kit download block edge

**Never on:** text blocks, buttons, form fields, navigation, footer. If everything is slanted, nothing is.

Implementation — `clip-path`, no JS:

```css
/* Folded card: top and bottom edges break at the centre and fall outward */
.fold-card{
  --rise: var(--fold-rise);
  clip-path: polygon(
    0 var(--rise), 50% 0, 100% var(--rise),
    100% calc(100% - var(--rise)), 50% 100%, 0 calc(100% - var(--rise))
  );
}
```

`--fold-rise` stays constant regardless of card width; on wide cards the slope naturally softens, which is the intended behaviour.

**Mobile:** below 640px, `--fold-rise: 8px`. At small widths 14px makes the card look skewed rather than folded.

---

## 7. Two signature interactions

### 7.1 FoldReveal — seeing through the wall

Used in exactly one place: the home page hero. Two layers sit on top of each other; wherever the pointer (or touch) goes, the top layer is pierced and the layer beneath shows through.

- Top layer: quiet — lockup and the one-line positioning statement.
- Bottom layer: motion pulled from the games (short loop videos or a screenshot mosaic).
- Mask via CSS: `mask-image: radial-gradient(circle var(--r) at var(--x) var(--y), #000 60%, transparent 100%)`.
- `fold-reveal.js` only updates the `--x` / `--y` custom properties. Throttle with `requestAnimationFrame`, listen to `pointermove`.
- **Touch devices and no-JS:** the mask stays fixed at the centre of the element. The site is fully functional without JavaScript.
- `prefers-reduced-motion: reduce` → mask fixed, no tracking.

Use this **once.** Repeat it on a second page and it stops being a signature and becomes a gimmick.

### 7.2 TesseraGrid — the mosaic grid

Content blocks are built from equal square cells (game cards, press-kit files, screenshots). CSS Grid, `grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))`, `gap: var(--s-4)`.

Cells use `FoldCard` for their broken edges. On hover a cell shifts to `--c-surface-2` and moves **2px up** (`transform: translateY(-2px)`). No other effect.

### 7.3 three.js — not in this phase

Discussed and **deferred to phase 2.** Heavy WebGL heroes are expensive on mobile and are, ironically, the thing that most makes sites look alike. Get the site fast and solid first; if it earns its place later, it goes only in the game-page hero, lazy-loaded, with a static poster fallback. **Whoever implements this spec must not add three.js.**

---

## 8. Component inventory

| Component | Props | Behaviour |
|---|---|---|
| `Mark.astro` | `size`, `mono?` | Inlines the SVG. Below 24px, switches to the mono variant automatically. |
| `Lockup.astro` | `variant: 'horizontal' \| 'stacked'` | Mark + wordmark. Header uses horizontal. |
| `FoldCard.astro` | `as?`, `href?` | The clip-path box from §6. Renders as `<a>` when `href` is given. |
| `FoldReveal.astro` | `topSlot`, `bottomSlot` | §7.1. Once per site. |
| `GameCard.astro` | `game` (content entry) | Cover, title, one-line mechanic, store badges. |
| `StoreBadges.astro` | `appStore?`, `playStore?` | Official badges from `public/badges/`. Renders nothing if no URLs. |
| `SectionRule.astro` | — | 1px rule that breaks at the centre. |
| `TesseraGrid.astro` | `min?` (default 260px) | Grid wrapper from §7.2. |
| `Prose.astro` | — | Long-form text: `max-width: var(--measure)` and typography. Privacy pages use this. |

Brand source files live in `tesser-brand/` (five SVGs plus an `assets/` folder). Copy them in rather than redrawing anything. Every mark file is flat paths — no masks, clips or strokes — so they render identically everywhere.

---

## 9. Accessibility

- One `<h1>` per page; never skip heading levels.
- Meaningful `alt` on every image; `alt=""` on decorative ones.
- Contrast: body text at least 4.5:1. **Green and purple are never text colours** — neither passes.
- Fully keyboard navigable; `:focus-visible` visible on every interactive element.
- `prefers-reduced-motion: reduce` disables all motion.
- Videos are `muted`, `playsinline`, `loop`; autoplay only for decorative loops.

---

## 10. Performance budget

| Metric | Target |
|---|---|
| First load (HTML+CSS+fonts, gzip) | < 100 KB |
| Client JS (gzip) | < 8 KB |
| Lighthouse (mobile) | 95+ across all four categories |
| CLS | 0 |
| Images | AVIF/WebP, explicit `width`/`height`, `loading="lazy"` outside the hero |
| Fonts | `font-display: swap`, latin subset only, weights 400 and 500 |

---

## 11. Never do this

Written specifically against the "AI slop" risk. Breaking these erases what makes the site distinct.

- ❌ Gradient backgrounds, mesh gradients, noise textures, glassmorphism, neon glow
- ❌ Scroll-reveal animations, parallax
- ❌ Emoji as icons
- ❌ Marketing language like "empowering", "seamless", "revolutionary"
- ❌ Cookie banner (analytics is cookieless; none is needed)
- ❌ Newsletter pop-ups
- ❌ Stock photography, stock illustration, generic 3D renders
- ❌ Any slope other than 17°
- ❌ Green and purple as adjacent surfaces

---

## 12. Next

`01-PAGES.md` — route map, content schema, per-page sections and copy.
