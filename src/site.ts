/** Site-wide constants. Used by the layout and by the Organization JSON-LD,
 *  so the footer links and `sameAs` can never drift apart. */

export const SITE = {
  name: "Tesser",
  url: "https://tessergames.com",
  support: "support@tessergames.com",
  press: "hello@tessergames.com",
} as const;

export const SOCIAL = [
  { href: "https://instagram.com/tessergames", label: "Instagram" },
  { href: "https://tiktok.com/@tessergames", label: "TikTok" },
  { href: "https://youtube.com/@tessergames", label: "YouTube" },
  { href: "https://x.com/tessergames", label: "X" },
] as const;

export const NAV = [
  { href: "/#games", label: "Games" },
  { href: "/play", label: "Play" },
  { href: "/press", label: "Press" },
  { href: "/support", label: "Support" },
] as const;
