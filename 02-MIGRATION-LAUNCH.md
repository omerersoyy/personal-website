# Tesser site — 02 · Migration and launch

> **Read `00-FOUNDATION.md` first.** This document runs after the site itself is built.

The defining property of this phase is **not breaking the order.** The existing privacy policy URLs are live links inside the App Store and Google Play listings. A migration done in the wrong order breaks the policy link on the store side, which can escalate to a review rejection.

---

## 1. Inventory the current state

The content to migrate lives in two GitHub Pages repositories:

| Repo | Files | Content |
|---|---|---|
| `qbic-policy` | `index.html`, `support.html`, `marketing.html` | Beaster's privacy policy, support and marketing pages |
| `innout/inout-parkour-policy` | same pattern | inout parkour equivalents |

**First task:** record the live URLs of both repos and find every place they are used in the two store consoles:

- Google Play Console → app → Store listing → *Privacy policy*, *Website*, *Email*
- App Store Connect → App Privacy → *Privacy Policy URL*; App Information → *Support URL*, *Marketing URL*

Put these URLs in a table. Each one gets verified at the end.

---

## 2. Infrastructure

### 2.1 Domain and hosting

1. Register `tessergames.com` through Cloudflare Registrar.
2. Create a Cloudflare Pages project, connect the git repo.
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add `tessergames.com` and `www.tessergames.com` as custom domains; redirect `www` → apex.
4. Enforce HTTPS ("Always Use HTTPS" on).
5. Add a `public/_redirects` file with `/download  /play  301`.

### 2.2 Email

Cloudflare Email Routing:

- `support@tessergames.com` → personal Gmail
- `hello@tessergames.com` → same inbox

Add the SPF and DMARC records Cloudflare suggests. **Test sending, not just receiving** — this address goes into the store consoles.

### 2.3 Analytics

Enable Cloudflare Web Analytics and add the snippet to `Base.astro`. It sets no cookies, so no consent banner is required.

---

## 3. Content migration

### 3.1 Privacy policies

1. `qbic-policy/index.html` → `/privacy/beaster`
2. inout parkour equivalent → `/privacy/inout-parkour`

**Carry the text over verbatim; do not rewrite it.** Beaster's policy covers AdMob, Firebase Analytics and UMP consent — that is legal content and stays. Only these change:

- Developer / publisher name → **Tesser**
- Contact address → `support@tessergames.com`
- Last-updated date

### 3.2 Support and marketing pages

`support.html` is condensed into `/support` (see `01-PAGES.md` §7). `marketing.html` content is distributed into the game page; it does not get its own route.

---

## 4. Redirects and store updates — order matters

Do not reorder these steps.

**Step 1 — New site is live.**
`tessergames.com` is up; `/privacy/beaster`, `/privacy/inout-parkour`, `/support` and `/play` all resolve. Verified by hand in a browser.

**Step 2 — Point the old pages at the new ones.**
The old GitHub Pages files are **not deleted.** Add to each `<head>`:

```html
<link rel="canonical" href="https://tessergames.com/privacy/beaster">
<meta http-equiv="refresh" content="0; url=https://tessergames.com/privacy/beaster">
```

Also leave a visible clickable link in the body, in case meta refresh is blocked.

**Step 3 — Update the store URLs.**

- Google Play Console → Store listing → privacy policy URL, website, support email
- App Store Connect → App Privacy → Privacy Policy URL; App Information → Support URL, Marketing URL
- Note that App Store Connect changes to some fields only go live with the next version submission — plan around that.

**Step 4 — Keep the old repos alive for at least 12 months.**
Those links are baked into app builds already in the wild. Deleting them breaks the link for anyone who has not updated.

---

## 5. SEO and sharing

- `astro.config.mjs` → `site: 'https://tessergames.com'`
- `@astrojs/sitemap` for `sitemap-index.xml`
- `public/robots.txt`: allow all, plus the sitemap line
- Unique `<title>` and `description` on every page
- `og:image` → `/og-1200x630.png` on the home page, the game cover on game pages
- `twitter:card` → `summary_large_image`
- `Organization` JSON-LD on the home page (`name: Tesser`, `url`, `logo`, `sameAs` → social profiles)
- `VideoGame` JSON-LD on game pages (see `01-PAGES.md` §5)
- `/play` and `/play/[slug]` are `noindex` — they exist for people arriving from a bio link

**Note:** the developer name shown on the App Store stays the legal personal name (individual memberships cannot change it). That is a deliberate decision. The site and JSON-LD use Tesser; the mismatch is acceptable.

---

## 6. Launch checklist

### Before going live

- [ ] Every route returns 200; a 404 page exists
- [ ] `/download` 301s to `/play`
- [ ] `/privacy/beaster` and `/privacy/inout-parkour` compared against the originals — no clauses lost
- [ ] `support@tessergames.com` both receives and sends
- [ ] favicon, apple-touch-icon and OG image in place
- [ ] Lighthouse mobile 95+ across all four categories
- [ ] Site navigable with JavaScript disabled
- [ ] No horizontal scrolling at 375px
- [ ] Sitemap and robots.txt reachable

### After going live

- [ ] Redirects added to the old GitHub Pages files
- [ ] Google Play Console URLs updated
- [ ] App Store Connect URLs updated
- [ ] **Verify:** click the privacy and support links in both store listings and confirm they land on the new pages
- [ ] Instagram / TikTok / YouTube / X bio links set to `tessergames.com/play`
- [ ] Share preview tested on one platform (does the OG image render)

---

## 7. Deferred to phase 2

Explicitly **not** in this phase:

- `/devlog` and RSS
- Mailing list or Discord
- three.js hero (see `00-FOUNDATION.md` §7.3)
- Multiple languages
- On inout parkour launch: flip `status` to `live`, add store badges, move it to the top of `/play` via the `order` field
