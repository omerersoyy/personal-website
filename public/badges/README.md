# Store badges

The official badge artwork is not checked in — Apple and Google require the
current files from their own asset pages, under their own guidelines.

Download and save with these exact names:

| File             | Source                                                                 |
| ---------------- | ---------------------------------------------------------------------- |
| `app-store.svg`  | https://developer.apple.com/app-store/marketing/guidelines/#downloadOnAppStore |
| `google-play.png`| https://play.google.com/intl/en_us/badges/                              |

Until a file is present, `StoreBadges.astro` renders a plain text button in its
place, so nothing breaks and no unofficial badge is ever shown.
