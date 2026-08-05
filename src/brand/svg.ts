/**
 * Brand SVGs ship as standalone files with their own width/height and a
 * hardcoded `style="color:…"` fallback. Inline copies need neither: sizing
 * comes from CSS and colour from `currentColor`. This normalisation runs at
 * build time, so it costs nothing at runtime.
 */
export function inlineSvg(
  raw: string,
  opts: { class?: string; label?: string } = {},
): string {
  let svg = raw
    // drop the XML comments the source files carry
    .replace(/<!--[\s\S]*?-->/g, "")
    // fixed pixel dimensions and the colour fallback belong to the file, not the page
    .replace(/\s(width|height)="[^"]*"/g, "")
    .replace(/\sstyle="[^"]*"/, "")
    .trim();

  if (opts.label) {
    svg = svg.replace(/\saria-label="[^"]*"/, ` aria-label="${opts.label}"`);
  } else {
    // decorative: the surrounding text already names the brand
    svg = svg
      .replace(/\saria-label="[^"]*"/, ' aria-hidden="true"')
      .replace(/\srole="img"/, "");
  }

  if (opts.class) {
    svg = svg.replace("<svg", `<svg class="${opts.class}"`);
  }

  return svg;
}
