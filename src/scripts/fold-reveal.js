// fold-reveal.js — updates --x / --y on the hero so the mask follows the
// pointer. That is all it does: no state, no layout reads beyond the rect,
// one rAF in flight at a time.
//
// Touch, no-JS and prefers-reduced-motion all fall back to a centred mask,
// which is handled entirely in CSS. This file simply does nothing in those
// cases.

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = window.matchMedia("(pointer: fine)").matches;

if (!reduced && fine) {
  for (const el of document.querySelectorAll("[data-fold-reveal]")) {
    let frame = 0;
    let px = 0;
    let py = 0;

    const paint = () => {
      frame = 0;
      el.style.setProperty("--x", px + "px");
      el.style.setProperty("--y", py + "px");
    };

    el.addEventListener(
      "pointermove",
      (event) => {
        const rect = el.getBoundingClientRect();
        px = event.clientX - rect.left;
        py = event.clientY - rect.top;
        if (!frame) frame = requestAnimationFrame(paint);
      },
      { passive: true },
    );

    el.addEventListener("pointerleave", () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      // Back to the centre — the resting state the layout is built around.
      el.style.removeProperty("--x");
      el.style.removeProperty("--y");
    });
  }
}
