import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Games collection (01-PAGES.md §2).
 *
 * Note on file location: the spec writes `src/content/config.ts`, which is the
 * pre-Astro-5 layout. Astro 7 uses the Content Layer API — the config lives at
 * `src/content.config.ts` and the entries stay in `src/content/games/`.
 */
const games = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/games" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(), // "Beaster"
      tagline: z.string(), // the mechanic, in one sentence — not the genre
      status: z.enum(["live", "soon", "wip"]),
      releaseDate: z.string().optional(), // ISO
      platforms: z.array(z.enum(["ios", "android"])),
      appStoreUrl: z.string().url().optional(),
      playStoreUrl: z.string().url().optional(),
      // Relative path into src/assets. image() hands the file to Astro's
      // pipeline, which emits WebP at the sizes actually used and fills in
      // width/height — the perf budget (00 §10) rules out shipping the
      // source PNGs.
      cover: image(),
      // The store icon — square, already rounded. Used where the game is
      // shown small (the /play cards). Falls back to the cover.
      icon: image().optional(),
      loop: z.string().optional(), // /games/<slug>/loop.mp4 — the mechanic, looping
      screenshots: z
        .array(z.object({ src: image(), alt: z.string() }))
        .default([]),
      accent: z.string().optional(), // the game's own colour, cover backdrop only
      order: z.number(),
    }),
});

/**
 * Privacy policies (01-PAGES.md §8).
 *
 * The bodies are carried over verbatim from the GitHub Pages repos and are not
 * rewritten — these URLs are live links inside both store listings, and the
 * AdMob / Firebase / GameAnalytics / UMP clauses have to survive the move.
 */
const policies = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/policies" }),
  schema: z.object({
    game: z.string(), // slug of the matching games entry
    title: z.string(),
    updated: z.string(), // as printed on the page it replaces
  }),
});

export const collections = { games, policies };
