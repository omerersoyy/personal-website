# Launch handoff

Working document for `02-MIGRATION-LAUNCH.md`. The spec is the reasoning; this
is the checklist you actually tick off.

**The one rule:** the old privacy policy URLs are live links inside both store
listings. Doing §4's steps out of order breaks the policy link on the store
side, which can escalate to a review rejection. Nothing in §4 happens until
`tessergames.com` resolves.

---

## 1. URL inventory — fill this in first

Record what is live *now*, before changing anything. Every row gets verified
again at the end.

| Where | Field | Current value | New value | Updated | Verified |
| ----- | ----- | ------------- | --------- | ------- | -------- |
| Play Console — Beaster | Privacy policy | | `https://tessergames.com/privacy/beaster` | ☐ | ☐ |
| Play Console — Beaster | Website | | `https://tessergames.com/games/beaster` | ☐ | ☐ |
| Play Console — Beaster | Email | | `support@tessergames.com` | ☐ | ☐ |
| App Store Connect — Beaster | Privacy Policy URL | | `https://tessergames.com/privacy/beaster` | ☐ | ☐ |
| App Store Connect — Beaster | Support URL | | `https://tessergames.com/support` | ☐ | ☐ |
| App Store Connect — Beaster | Marketing URL | | `https://tessergames.com/games/beaster` | ☐ | ☐ |
| Play Console — inout parkour | Privacy policy | | `https://tessergames.com/privacy/inout-parkour` | ☐ | ☐ |
| App Store Connect — inout parkour | Privacy Policy URL | | `https://tessergames.com/privacy/inout-parkour` | ☐ | ☐ |

Old repos, for reference:

- `omerersoyy/qbic-policy` — Beaster (`com.beasterthecat.game`)
- `omerersoyy/inout-parkour-policy` — inout parkour (`com.innout.game`)

**Note:** some App Store Connect fields only go live with the next version
submission. Plan the Beaster URL change around a release, or accept a gap.

---

## 2. Before the site goes live

- [ ] Fill in `appStoreUrl` / `playStoreUrl` in `src/content/games/beaster.md`
- [ ] Real `cover.webp` for both games (currently placeholders)
- [ ] Official store badges in `public/badges/` (see the README there)
- [ ] Register `tessergames.com`, create the Cloudflare Pages project
      (build `npm run build`, output `dist`)
- [ ] Custom domains: apex + `www`, `www` → apex, Always Use HTTPS on
- [ ] Email Routing: `support@` and `hello@` → your inbox, plus SPF and DMARC.
      **Test sending, not just receiving** — this address goes in the consoles.
- [ ] Cloudflare Web Analytics enabled, snippet added to `Base.astro`
- [ ] Every route returns 200; `/download` 301s to `/play`
- [ ] Lighthouse mobile 95+ across all four categories
- [ ] Site navigable with JavaScript disabled
- [ ] No horizontal scrolling at 375px
- [ ] `/sitemap-index.xml` and `/robots.txt` reachable

### Compare the policies against the originals

The migrated text is verbatim apart from the three changes §3.1 calls for
(publisher → Tesser, contact → `support@tessergames.com`, date). Confirm no
clause was lost — particularly Beaster's AdMob / Firebase / ATT clauses and
inout parkour's GameAnalytics consent clauses:

```bash
# rough side-by-side; expect only the three intended differences
diff <(sed -e 's/<[^>]*>//g' ../qbic-policy/index.html) \
     <(sed -e 's/^---$//' src/content/policies/beaster.md)
```

---

## 3. After the site is live — in this order

### Step 1 — Confirm the new pages resolve

By hand, in a browser: `/privacy/beaster`, `/privacy/inout-parkour`,
`/support`, `/play`. Not curl. Not "it built fine."

### Step 2 — Point the old pages at the new ones

**Do not delete the old files.** Add to the `<head>` of each old `index.html`:

`qbic-policy/index.html`:

```html
<link rel="canonical" href="https://tessergames.com/privacy/beaster">
<meta http-equiv="refresh" content="0; url=https://tessergames.com/privacy/beaster">
```

`inout-parkour-policy/index.html`:

```html
<link rel="canonical" href="https://tessergames.com/privacy/inout-parkour">
<meta http-equiv="refresh" content="0; url=https://tessergames.com/privacy/inout-parkour">
```

And a visible fallback at the top of each `<body>`, in case meta refresh is
blocked — swap the slug for the inout parkour file:

```html
<p style="margin:0 0 24px;padding:12px 16px;background:#f2f4f6;border-radius:8px">
  This policy has moved to
  <a href="https://tessergames.com/privacy/beaster">tessergames.com/privacy/beaster</a>.
</p>
```

`qbic-policy/support.html` points at `https://tessergames.com/support` the same
way. `marketing.html` points at the game page.

### Step 3 — Update the store URLs

Work down the table in §1, ticking "Updated" as you go.

### Step 4 — Keep the old repos alive for at least 12 months

Those URLs are baked into app builds already on people's phones. Deleting them
breaks the policy link for anyone who has not updated.

---

## 4. After going live

- [ ] Click the privacy and support links **inside both store listings** and
      confirm they land on the new pages
- [ ] Instagram / TikTok / YouTube / X bio links → `tessergames.com/play`
- [ ] Instagram account renamed to `tessergames` (rename, don't recreate —
      followers and history are a signal)
- [ ] Share preview tested on one platform: does the OG image render
- [ ] Every "Verified" box in §1 ticked

---

## 5. Explicitly not in this phase

`/devlog` and RSS, mailing list or Discord, the three.js hero, and multiple
languages. All deferred to phase 2.
