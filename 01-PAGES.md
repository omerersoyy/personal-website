# Tesser site — 01 · Pages

> **Read `00-FOUNDATION.md` first.** Token names, component names, the 17° rule and the "never do this" list live there.

All site copy is in English. Draft copy in this document can be used verbatim.

---

## 1. Route map

| Route | File | Purpose |
|---|---|---|
| `/` | `pages/index.astro` | Brand + both games + install |
| `/play` | `pages/play/index.astro` | **Link-in-bio page.** All games, all stores, nothing else |
| `/play/[slug]` | `pages/play/[slug].astro` | One game, both stores — for per-game campaigns |
| `/games/[slug]` | `pages/games/[slug].astro` | Game detail |
| `/press` | `pages/press.astro` | For press and creators |
| `/support` | `pages/support.astro` | Support and contact |
| `/privacy/[slug]` | `pages/privacy/[slug].astro` | Privacy policy per game |

`/download` redirects to `/play` (Cloudflare Pages `_redirects` file, 301).

No `/devlog` in this phase. An empty blog section makes a site look abandoned; it gets added when there are posts.

---

## 2. Content schema

`src/content/config.ts`:

```ts
import { defineCollection, z } from 'astro:content';

const games = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),                    // "Beaster"
    tagline: z.string(),                  // the mechanic, in one sentence
    status: z.enum(['live', 'soon', 'wip']),
    releaseDate: z.string().optional(),   // ISO
    platforms: z.array(z.enum(['ios', 'android'])),
    appStoreUrl: z.string().url().optional(),
    playStoreUrl: z.string().url().optional(),
    cover: z.string(),                    // /games/<slug>/cover.webp
    loop: z.string().optional(),          // /games/<slug>/loop.mp4 — the mechanic, looping
    screenshots: z.array(z.object({ src: z.string(), alt: z.string() })),
    accent: z.string().optional(),        // the game's own colour, cover backdrop only
    order: z.number(),
  }),
});

export const collections = { games };
```

The markdown body is the game's long description, rendered inside `Prose` on `/games/<slug>`.

### Data to fill in

**beaster.md** — `status: live`, iOS + Android, store URLs exist.
Draft tagline: `Move between the walls of cubes. Run, remember the maze, react.`

**inout-parkour.md** — `status: soon` (flip to `live` at launch).
Draft tagline: `Slip inside the walls and back out. One wrong move and the run resets.`

Tagline rule: **describe the mechanic, not the genre.** Not "a fun puzzle game" — say that you move between the walls.

---

## 3. `/` — Home

Goal: in ten seconds, who this is, what they make, which games, where to get them.

### Sections

**3.1 Hero — `FoldReveal`**

The site's one signature interaction (00 §7.1). Top layer:

- `Lockup` (stacked)
- H1: `Small games built around one strange mechanic.`
- Sub-line in `--c-mist`: `Made by one person.`

Bottom layer: a silent mosaic of both games' loop videos. As the pointer moves, the motion underneath shows through — the site demonstrates its idea instead of describing it.

No buttons in the hero. No scroll indicator.

**3.2 Games — `TesseraGrid` + `GameCard`**

Two cards. Each: cover, title, tagline, status badge (`Out now` / `Coming soon`), store badges. The whole card links to `/games/<slug>`.

Section heading: `Games`

**3.3 Approach — short text block**

Three or four sentences at `--measure` width. Draft:

> Every Tesser game starts with one question: what if you could get to the other side of a wall without walking around it?
>
> The games are small on purpose. One mechanic, explored properly, is more interesting than five mechanics stacked on top of each other.

No photo, no "about us" voice, no team.

**3.4 Footer**

Left: small horizontal `Lockup`. Centre: `Games` · `Play` · `Press` · `Support` · `Privacy`. Right: social links (Instagram, TikTok, YouTube, X) as text, no icon library.

Bottom line: `© <year> Tesser` and `support@tessergames.com`.

### SEO

```
<title>Tesser — small games built around one strange mechanic</title>
<meta name="description" content="Solo game developer. Beaster and inout parkour — small mobile games built around a single unusual mechanic.">
og:image = /og-1200x630.png
```

---

## 4. `/play` — the link-in-bio page

This is the URL that goes in the Instagram, TikTok, YouTube and X bios: **`tessergames.com/play`**. It replaces any link-shortener or Linktree.

Design constraints, because it is opened almost entirely on phones from a bio tap:

- Everything above the fold on a 375×667 screen. **No scrolling to reach a store button.**
- One `FoldCard` per game, stacked vertically. Each card: icon, title, one-line tagline, then App Store and Google Play buttons side by side.
- Games with `status: soon` show `Coming soon` instead of buttons, plus a link to `/games/<slug>`.
- Small `Lockup` at the top, nothing else. No nav, no footer links except a single quiet `tessergames.com` back to home.
- No hero, no `FoldReveal`, no video. This page is a door, not a room.
- Buttons are the official store badges from `public/badges/`, minimum 44px tall touch targets.

**Order:** newest / most promoted game first. That order is a manual `order` field, not alphabetical — during the inout parkour launch it goes on top.

`<title>Play Tesser games</title>`, `<meta name="robots" content="noindex">` — this page exists for humans arriving from a bio, not for search.

### `/play/[slug]`

Same layout, one game only. For a campaign where a specific game is being promoted (e.g. a launch clip): `tessergames.com/play/beaster`.

---

## 5. `/games/[slug]` — Game page

Its only job is to make the install decision easy. What matters is **showing** the mechanic, not describing it.

### Sections

1. **Hero** — the game's `loop.mp4` full-width, muted, looping, `playsinline`. Bottom edge broken at 17° (00 §6). Over it: game title (H1) and tagline. Falls back to `cover` if there is no video.
2. **Install** — `StoreBadges`. Appears twice: directly under the hero and at the bottom of the page.
3. **The mechanic** — two or three sentences plus a second short video/GIF showing the mechanic. This section is the heart of the page.
4. **Screenshots** — `TesseraGrid` from the `screenshots` array. No frames, just `--radius`.
5. **Details** — a small table in `--f-mono`: platforms, release date, price, developer. Alongside it, links to `/privacy/<slug>` and `/support`.

For `status: soon`, replace store badges with a single line: `Coming soon to the App Store and Google Play.`

### SEO

`<title>` = `<Game name> — Tesser`, description = tagline. `og:image` is the game's cover.

**Schema.org:** add `VideoGame` JSON-LD per game page (`name`, `applicationCategory: "GameApplication"`, `operatingSystem`, `offers`, `author` → `Tesser`).

---

## 6. `/press` — Press kit

Goal: a YouTuber or journalist finds what they need in 30 seconds. No long prose.

1. **One-paragraph boilerplate**, written to be copy-pasted:
   > Tesser is a one-person game studio. Its games are built around a single unusual spatial mechanic — moving through walls instead of around them. Beaster is out now on iOS and Android; inout parkour follows in 2026.
2. **Downloads** — `TesseraGrid`, one cell per file: logo pack (SVG+PNG), per-game screenshot bundles, icons, trailer link. File sizes shown in `--f-mono`.
3. **Fact sheet** — developer name, location, founded, contact, social links.
4. **Contact** — `hello@tessergames.com` with a copy button (`copy-email.js`).

Everything is also available as one archive: `/press/tesser-press-kit.zip`.

---

## 7. `/support` — Support

Short and functional. Do not write a long FAQ.

1. One sentence: `Something broken, or an idea? Write to support@tessergames.com — it goes straight to the person who made the game.`
2. The address, large and easy to copy.
3. Response expectation: `Usually within a few days.`
4. Quick links: each game's privacy policy.
5. **No contact form.** A form needs a backend and attracts spam; email is enough.

---

## 8. `/privacy/[slug]` — Privacy policies

Existing text is migrated (see `02-MIGRATION-LAUNCH.md`). Page structure:

- H1: `Privacy Policy — <Game name>`
- Last-updated date in `--f-mono`
- Body inside `Prose`
- Contact line and a link to the other game's policy at the bottom

**These URLs are live links in the store listings.** Keep them plain, fast, and free of JavaScript.

Text is carried over verbatim; **do not rewrite it.** Beaster's policy covers AdMob, Firebase Analytics and UMP consent handling — those clauses must survive the move.

---

## 9. Acceptance criteria

This phase is done when:

- [ ] All routes resolve; `/download` 301s to `/play`
- [ ] With JavaScript disabled the site is fully readable and navigable (the hero mask stays centred)
- [ ] `/play` shows a store button for every live game without scrolling on a 375×667 viewport
- [ ] No horizontal scrolling at 375px on any page
- [ ] Lighthouse mobile: 95+ in all four categories
- [ ] Client JS under 8 KB gzipped
- [ ] `--c-green` and `--c-accent` are never used as body text colour
- [ ] No slope other than 17° anywhere
- [ ] Zero violations of `00-FOUNDATION.md` §11

---

## 10. Next

`02-MIGRATION-LAUNCH.md` — migrating the existing privacy pages, store URL updates, Cloudflare setup, launch checklist.
