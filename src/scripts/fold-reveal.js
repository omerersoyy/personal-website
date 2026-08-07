// fold-reveal.js — moves the hero aperture with the pointer.
//
// The position is interpolated rather than assigned: the hole trails a little
// behind the cursor instead of being welded to it. That lag is the whole
// difference between "a CSS demo" and something that feels physical, and it
// costs one lerp.
//
// Touch, no-JS and prefers-reduced-motion all fall back to a centred aperture,
// which is handled entirely in CSS. This file simply does nothing in those
// cases — nothing here ships work to phones.

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = window.matchMedia("(pointer: fine)").matches;

// How much of the remaining distance to close each frame. Lower trails more.
const EASE = 0.14;
// Sub-pixel threshold to park the loop rather than spin on rounding noise.
const SETTLE = 0.4;

if (!reduced && fine) {
  for (const el of document.querySelectorAll("[data-fold-reveal]")) {
    let frame = 0;
    let started = false;
    // Target, then current.
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;

    const tick = () => {
      x += (tx - x) * EASE;
      y += (ty - y) * EASE;
      el.style.setProperty("--x", x + "px");
      el.style.setProperty("--y", y + "px");

      frame =
        Math.abs(tx - x) > SETTLE || Math.abs(ty - y) > SETTLE
          ? requestAnimationFrame(tick)
          : 0;
    };

    el.addEventListener(
      "pointermove",
      (event) => {
        const rect = el.getBoundingClientRect();
        tx = event.clientX - rect.left;
        ty = event.clientY - rect.top;

        // First move: start from the resting centre so the aperture slides
        // out of it instead of teleporting from 0,0. Only now does the pixel
        // form of mask-position become correct, so `tracking` goes on here —
        // before this the CSS keeps the aperture at `center`.
        if (!started) {
          started = true;
          x = rect.width / 2;
          y = rect.height / 2;
          el.style.setProperty("--x", x + "px");
          el.style.setProperty("--y", y + "px");
          el.classList.add("tracking");
        }

        if (!frame) frame = requestAnimationFrame(tick);
      },
      { passive: true },
    );

    el.addEventListener("pointerleave", () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      started = false;
      // Back to the centre — the resting state the layout is built around.
      // Dropping `tracking` restores the `center` keyword, which is the only
      // form that is correct without pixels behind it.
      el.classList.remove("tracking");
      el.style.removeProperty("--x");
      el.style.removeProperty("--y");
    });
  }
}
