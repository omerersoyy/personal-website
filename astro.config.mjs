// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://tessergames.com",
  integrations: [
    sitemap({
      // /play and /play/[slug] are noindex — they exist for people arriving
      // from a bio link, not for search (02-MIGRATION-LAUNCH.md §5). Listing
      // them in the sitemap while telling robots to ignore them is a
      // contradiction, so they are excluded here too.
      filter: (page) => !page.includes("/play"),
    }),
  ],
  build: {
    inlineStylesheets: "always",
  },
});
