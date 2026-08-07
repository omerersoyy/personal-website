// blob.js — inout parkour's menu actor, ported to the DOM.
//
// In the game (src/menu_char.gd) the blob treats the visible BUTTON BOXES as
// game boxes: it runs their perimeter, hops between them, and seeps through a
// wall to the other face. Here the boxes are real elements on this page —
// anything tagged [data-blob-box]. The site becomes a level.
//
// The game walks rectangles. This walks POLYGONS, because the cards here are
// not rectangles: their top and bottom edges break at the centre (the 17° fold,
// 00-FOUNDATION §6). Walking their bounding rect left the blob treading air
// above the folded corners. The locomotion rules are otherwise the game's:
// clockwise winding with outward normals, a perimeter walk that wraps, a jump
// that targets the edge facing the jumper, and a landing direction taken from
// the flight vector projected on that edge.
//
// COSMETIC ONLY, exactly as in the game. It never intercepts a pointer event
// (pointer-events: none), it is aria-hidden, and nothing on the page reads it.

const SPRITE = "/blob-sheet.png";
const FRAMES_WALK = [0, 1, 2, 3];
const FRAME_SEEP = 4; // flatten, played at the in/out toggle
const FRAME_JUMP = 8; // vertical stretch, played in flight
const WALK_FPS = 8;
const SEEP_TIME = 0.18;

const SIZE = 30; // drawn size in CSS px
const WALL_OFFSET = 9; // how far the body floats off the wall
const SPEED = 105; // px/s along the perimeter (game: 173 at 1080 wide)
const JUMP_SPEED = 470; // px/s in flight (game: 675)
const ACTION_MIN = 1.6;
const ACTION_MAX = 4.2;
const P_JUMP = 0.5;
const P_FLIP = 0.25;
const INSIDE_MIN = 1.5;
const INSIDE_MAX = 4.0;
const LAND_MARGIN = 10;
const SQUASH_DECAY = 4;
const MAX_DT = 0.04;
const STARTLE_RADIUS = 90; // pointer this close and it bolts

const OUT = 0;
const IN = 1;

const rand = (a, b) => a + Math.random() * (b - a);

// ---- polygon geometry ---------------------------------------------------
// Winding is clockwise on screen (y down), so the outward normal of an edge
// running (dx, dy) is (dy, -dx). Same convention as BoxData.edge_info.
function buildSegs(pts) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) continue;
    const ux = dx / len;
    const uy = dy / len;
    segs.push({ x: a.x, y: a.y, ux, uy, nx: uy, ny: -ux, len, s0: total });
    total += len;
  }
  return { segs, total };
}

// Arclength of the point on `poly` closest to p. Used when crossing a wall:
// the two perimeters are different lengths, so carrying the raw distance (or
// even the fraction) teleports the blob along the wall. Crossing should move it
// through the wall and nowhere else.
function nearestS(poly, p) {
  let best = 0;
  let bestD = Infinity;
  for (const g of poly.segs) {
    const t = Math.max(
      0,
      Math.min(g.len, (p.x - g.x) * g.ux + (p.y - g.y) * g.uy),
    );
    const dx = g.x + g.ux * t - p.x;
    const dy = g.y + g.uy * t - p.y;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = g.s0 + t;
    }
  }
  return best;
}

function pointAt(poly, s, off) {
  const L = poly.total;
  s = ((s % L) + L) % L;
  for (const g of poly.segs) {
    if (s <= g.s0 + g.len) {
      const t = s - g.s0;
      return {
        x: g.x + g.ux * t + g.nx * off,
        y: g.y + g.uy * t + g.ny * off,
        seg: g,
      };
    }
  }
  const g = poly.segs[poly.segs.length - 1];
  return { x: g.x, y: g.y, seg: g };
}

// Offset every edge inward by d and re-intersect the neighbours. Exact for the
// convex shapes here, and unlike scaling about the centroid it keeps a uniform
// gap on a non-square box.
function insetPolygon(pts, d) {
  const n = pts.length;
  const lines = [];
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const nx = uy;
    const ny = -ux; // outward
    lines.push({ px: a.x - nx * d, py: a.y - ny * d, ux, uy });
  }
  const out = [];
  for (let i = 0; i < n; i++) {
    const l1 = lines[(i - 1 + n) % n];
    const l2 = lines[i];
    const den = l1.ux * l2.uy - l1.uy * l2.ux;
    if (Math.abs(den) < 1e-6) {
      out.push({ x: l2.px, y: l2.py });
      continue;
    }
    const t = ((l2.px - l1.px) * l2.uy - (l2.py - l1.py) * l2.ux) / den;
    out.push({ x: l1.px + l1.ux * t, y: l1.py + l1.uy * t });
  }
  return out;
}

export function startBlob() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const host = document.createElement("div");
  host.className = "blob-host";
  host.setAttribute("aria-hidden", "true");

  const el = document.createElement("div");
  el.className = "blob";
  host.appendChild(el);
  document.body.appendChild(host);

  // ---- platforms -------------------------------------------------------
  // Page coordinates, not viewport: an absolutely positioned host means the
  // blob scrolls with the document for free and nothing has to be recomputed
  // while scrolling.
  let boxes = [];

  function shapeOf(node, r, sx, sy) {
    const x = r.left + sx;
    const y = r.top + sy;
    const w = r.width;
    const h = r.height;
    // A folded card declares its own break as --rise. Anything else is a
    // rectangle. Reading the custom property means the shape here can never
    // drift from the shape CSS is drawing.
    const rise = parseFloat(getComputedStyle(node).getPropertyValue("--rise"));
    if (rise > 0.5) {
      return [
        { x, y: y + rise },
        { x: x + w / 2, y },
        { x: x + w, y: y + rise },
        { x: x + w, y: y + h - rise },
        { x: x + w / 2, y: y + h },
        { x, y: y + h - rise },
      ];
    }
    return [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h },
    ];
  }

  function measure() {
    const sx = window.scrollX;
    const sy = window.scrollY;
    boxes = [];
    for (const node of document.querySelectorAll("[data-blob-box]")) {
      if (node.offsetParent === null) continue;
      const r = node.getBoundingClientRect();
      if (r.width < SIZE * 2 || r.height < SIZE * 2) continue;
      const pts = shapeOf(node, r, sx, sy);
      const outer = buildSegs(pts);
      const inner = buildSegs(insetPolygon(pts, WALL_OFFSET));
      boxes.push({
        polys: [outer, inner],
        cx: r.left + sx + r.width / 2,
        cy: r.top + sy + r.height / 2,
        // A perch, not a destination: somewhere the blob may start but must
        // never jump back to. See the aperture box in index.astro.
        start: node.dataset.blobBox === "start",
      });
    }
    // Start on a perch when there is one — otherwise anywhere.
    if (!ready) {
      const perch = boxes.findIndex((b) => b.start);
      startIndex = perch >= 0 ? perch : Math.floor(Math.random() * boxes.length);
    }
  }

  // ---- state (mirrors menu_char.gd) ------------------------------------
  let pi = 0,
    s = 0,
    dir = 1,
    side = OUT;
  let act = "run";
  let squash = 0,
    time = 0,
    actionAt = 0;
  let seepUntil = -1,
    flipBackAt = -1;
  let jf = { x: 0, y: 0 },
    jv = { x: 0, y: 0 },
    jdist = 0,
    jtravel = 0;
  let landPi = 0,
    landS = 0,
    landDir = 1;
  let ready = false;
  let lastSeg = null;
  let startIndex = 0;

  const poly = () => boxes[pi].polys[side];
  // Outside, the blob floats WALL_OFFSET clear of the wall. Inside, it walks
  // the already-inset polygon, so the offset is zero and corners behave.
  const wallOff = () => (side === OUT ? WALL_OFFSET : 0);

  function pos() {
    if (act === "jump")
      return { x: jf.x + jv.x * jtravel, y: jf.y + jv.y * jtravel };
    const p = pointAt(poly(), s, wallOff());
    lastSeg = p.seg;
    return p;
  }

  function place() {
    measure();
    if (!boxes.length) {
      ready = false;
      host.style.opacity = "0";
      return;
    }
    if (!ready) {
      pi = startIndex;
      s = boxes[pi].polys[OUT].total * 0.12;
      dir = 1;
      side = OUT;
      act = "run";
      scheduleAction();
    } else if (pi >= boxes.length) {
      pi = 0;
      s = 0;
      side = OUT;
      act = "run";
    }
    ready = true;
    host.style.opacity = "1";
  }

  function scheduleAction() {
    actionAt = time + rand(ACTION_MIN, ACTION_MAX);
  }

  // Seep to the other face of the same box. Only the surface changes; the
  // position along the perimeter carries over as a fraction, since the inner
  // and outer perimeters are different lengths.
  function flip() {
    const here = pos();
    side = side === IN ? OUT : IN;
    s = nearestS(poly(), here);
    seepUntil = time + SEEP_TIME;
    if (side === IN) flipBackAt = time + rand(INSIDE_MIN, INSIDE_MAX);
  }

  function rollAction() {
    scheduleAction();
    const r = Math.random();
    if (r < P_JUMP && boxes.length >= 2 && side === OUT) startJump();
    else if (r < P_JUMP + P_FLIP) flip();
    // else keep running — the pauses between verbs are what make it calm.
  }

  function run(dt) {
    s += dir * SPEED * dt;
    const L = poly().total;
    s = ((s % L) + L) % L;
  }

  // Hop to another box. The target edge is the one FACING the jumper, and the
  // landing point is the jumper's own projection onto it, so the flight reads
  // as a short hop rather than a flight through the box.
  function startJump(fleeFrom) {
    if (boxes.length < 2) return;
    const from = pos();
    let target = pi;
    const eligible = boxes.filter((b, i) => i !== pi && !b.start).length;
    if (!eligible) return;
    if (fleeFrom) {
      let bestD = -Infinity;
      boxes.forEach((b, i) => {
        if (i === pi || b.start) return;
        const d = (b.cx - fleeFrom.x) ** 2 + (b.cy - fleeFrom.y) ** 2;
        if (d > bestD) {
          bestD = d;
          target = i;
        }
      });
    } else {
      let guard = 0;
      while ((target === pi || boxes[target].start) && guard++ < 40)
        target = Math.floor(Math.random() * boxes.length);
      if (target === pi || boxes[target].start) return;
    }
    if (target === pi) return;

    const b = boxes[target];
    let ax = from.x - b.cx;
    let ay = from.y - b.cy;
    const al = Math.hypot(ax, ay) || 1;
    ax /= al;
    ay /= al;

    const p = b.polys[OUT];
    let best = null;
    let bestDot = -Infinity;
    for (const g of p.segs) {
      const d = g.nx * ax + g.ny * ay;
      if (d > bestDot) {
        bestDot = d;
        best = g;
      }
    }
    const proj = (from.x - best.x) * best.ux + (from.y - best.y) * best.uy;
    const t = Math.min(
      Math.max(proj, LAND_MARGIN),
      Math.max(LAND_MARGIN, best.len - LAND_MARGIN),
    );
    const to = {
      x: best.x + best.ux * t + best.nx * WALL_OFFSET,
      y: best.y + best.uy * t + best.ny * WALL_OFFSET,
    };
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return;

    jf = from;
    jdist = dist;
    jv = { x: dx / dist, y: dy / dist };
    jtravel = 0;
    landPi = target;
    landS = best.s0 + t;
    const d = jv.x * best.ux + jv.y * best.uy;
    landDir = d === 0 ? 1 : Math.sign(d);
    act = "jump";
    side = OUT;
  }

  function stepJump(dt) {
    jtravel += JUMP_SPEED * dt;
    if (jtravel < jdist) return;
    // Landing: the new running direction is the sign of the flight vector
    // projected on the landing edge's tangent — what makes a landing read as
    // continuous rather than as a stop.
    pi = landPi;
    side = OUT;
    s = landS;
    dir = landDir;
    squash = 1;
    act = "run";
    scheduleAction();
  }

  // ---- pointer: the blob bolts when the cursor gets close ---------------
  let pointer = null;
  if (window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener(
      "pointermove",
      (ev) => {
        pointer = { x: ev.pageX, y: ev.pageY };
      },
      { passive: true },
    );
  }

  // ---- loop ------------------------------------------------------------
  let last = 0;
  let raf = 0;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000 || 0, MAX_DT);
    last = now;
    if (!ready) return;

    time += dt;
    squash = Math.max(0, squash - dt * SQUASH_DECAY);

    if (act === "jump") {
      stepJump(dt);
    } else {
      run(dt);
      if (side === IN && time >= flipBackAt) flip();
      if (time >= actionAt) rollAction();

      if (pointer) {
        const p = pos();
        if (Math.hypot(p.x - pointer.x, p.y - pointer.y) < STARTLE_RADIUS) {
          if (side === IN) flip();
          startJump(pointer);
          scheduleAction();
        }
      }
    }

    // ---- draw ----
    const p = pos();
    let rot, frameIdx;
    if (act === "jump") {
      rot = Math.atan2(jv.y, jv.x) + Math.PI / 2;
      frameIdx = FRAME_JUMP;
    } else {
      const g = lastSeg;
      const sgn = side === OUT ? 1 : -1;
      rot = Math.atan2(g.ny * sgn, g.nx * sgn) + Math.PI / 2;
      frameIdx =
        time < seepUntil
          ? FRAME_SEEP
          : FRAMES_WALK[Math.floor(time * WALK_FPS) % FRAMES_WALK.length];
    }
    el.style.backgroundPosition = `${-frameIdx * SIZE}px 0`;
    el.style.transform =
      `translate3d(${p.x}px, ${p.y}px, 0) rotate(${rot}rad) ` +
      `scale(${1 + squash * 0.22}, ${1 - squash * 0.3})`;
  }

  // ---- lifecycle -------------------------------------------------------
  const img = new Image();
  img.src = SPRITE;
  img
    .decode()
    .catch(() => {})
    .finally(() => {
      place();
      raf = requestAnimationFrame(frame);
    });

  let resizeTimer = 0;
  const remeasure = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(place, 150);
  };
  window.addEventListener("resize", remeasure, { passive: true });
  window.addEventListener("load", remeasure);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!raf) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  });
}

startBlob();
