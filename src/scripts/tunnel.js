// tunnel.js — Beaster's corridor, seen from inside.
//
// A REAL tunnel, not a faked one: a closed rectangular circuit — a squared-off
// letter O — with a camera flying its centreline forever. Everything on screen
// is a projection of actual geometry, so the corridor bends away at the corners
// the way a place does, instead of being a stack of squares nudged sideways.
//
// Four earlier versions are worth naming so nobody rebuilds them: a straight
// wireframe tube (a screensaver), a sine-curved one (a wormhole), a stepped one
// that slid past a wall, and a shaded shaft with random openings. All of them
// invented the turn frame by frame. This one has a floor plan.
//
// The camera also ROLLS a quarter turn through each corner, which is Beaster's
// actual verb: to take a turn the character transfers to the adjoining wall, so
// "down" ends up somewhere else. Four corners, four quarter turns — one lap
// comes back to level, which is why the loop can run forever without drifting.
//
// Still no WebGL and no library: one canvas, ~120 lines of vector maths.
//
// Palette is the site's, not the game's. Beaster's violet would collide with
// the accent colour (purple means interaction here, 00-FOUNDATION §5), so the
// form carries the game and the colour stays on brand.

const R = 1.15; // corridor half-width, the unit everything else is in
const EXT_X = 13; // loop half-extent along x
const EXT_Z = 9; // loop half-extent along z
// Corner radius. Tight corners look right on a floor plan and terrible from
// inside: at 2.6 the outer wall of the bend sits right across the view and the
// hero becomes a flat panel for seconds at a time. Wide enough to see round.
const CORNER = 5;
const LEAD = 3.2; // the camera aims this far down the path, not at the tangent
const SPEED = 2.6; // units per second

const STEP = 0.62; // spacing of the cross-sections drawn
const D_NEAR = 0.28; // nearest cross-section
const D_FAR = 11; // furthest
const FOCAL_K = 0.72; // focal length as a fraction of the canvas
// Tiles across each face. In the middle of a bend a narrow corridor simply
// cannot see far — the outer wall is right there, which is true in the game too
// — so those seconds have to look like a tiled wall rather than a blank sheet.
// One panel per face gave a flat plate; three strips give it a surface.
const TILES = 3;

export function startTunnel(canvas) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = canvas.getContext("2d", { alpha: true });

  // Face values are spelled out rather than taken from the tokens: the surface
  // tokens sit within a few percent of each other, which is right for cards on
  // a page and useless for a lit box — with those, all four faces read as one
  // flat black. This is the same neutral family, opened out far enough that
  // ceiling, walls and floor separate. Ceiling darkest, floor lightest, as the
  // game lights it.
  const FACE = ["#0a0d12", "#1e2632", "#27313f", "#161c25"]; // up, right, down, left
  const SEAM = "rgba(242, 244, 246, 0.07)";

  // Per-tile shades: each face's value, nudged a few percent per strip, so a
  // wall is made of panels instead of being one flat fill.
  const shade = (hex, f) => {
    const n = parseInt(hex.slice(1), 16);
    const ch = [n >> 16, (n >> 8) & 255, n & 255].map((v) =>
      Math.max(0, Math.min(255, Math.round(v * f + 3 * (f - 1)))),
    );
    return `rgb(${ch[0]}, ${ch[1]}, ${ch[2]})`;
  };
  const TILE_FILL = [];
  for (let f = 0; f < 4; f++) {
    for (let t = 0; t < TILES; t++) {
      TILE_FILL.push(shade(FACE[f], 1 + (t % 2 ? 0.1 : -0.06)));
    }
  }

  let w = 0,
    h = 0,
    dpr = 1,
    raf = 0,
    last = 0,
    s = 0; // arclength travelled along the circuit

  // ---- the circuit ------------------------------------------------------
  // A rectangle with quarter-circle corners, in the XZ plane. Built once as a
  // list of segments with cumulative arclength, so position and heading at any
  // distance are a lookup rather than an integration.
  const ax = EXT_X - CORNER;
  const az = EXT_Z - CORNER;
  const arc = (Math.PI / 2) * CORNER;
  const segs = [];
  let total = 0;
  const straight = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    segs.push({ kind: "s", x0, z0, dx: (x1 - x0) / len, dz: (z1 - z0) / len, len, s0: total });
    total += len;
  };
  const bend = (cx, cz, a0) => {
    segs.push({ kind: "a", cx, cz, a0, len: arc, s0: total });
    total += arc;
  };
  // Clockwise seen from above: +x, then +z, then −x, then −z.
  straight(-ax, -EXT_Z, ax, -EXT_Z);
  bend(ax, -az, -Math.PI / 2);
  straight(EXT_X, -az, EXT_X, az);
  bend(ax, az, 0);
  straight(ax, EXT_Z, -ax, EXT_Z);
  bend(-ax, az, Math.PI / 2);
  straight(-EXT_X, az, -EXT_X, -az);
  bend(-ax, -az, Math.PI);

  // Position and heading at arclength d.
  function at(d) {
    d = ((d % total) + total) % total;
    let seg = segs[segs.length - 1];
    for (const g of segs) {
      if (d < g.s0 + g.len) {
        seg = g;
        break;
      }
    }
    const t = d - seg.s0;
    if (seg.kind === "s") {
      return {
        x: seg.x0 + seg.dx * t,
        z: seg.z0 + seg.dz * t,
        fx: seg.dx,
        fz: seg.dz,
      };
    }
    const a = seg.a0 + t / CORNER;
    return {
      x: seg.cx + Math.cos(a) * CORNER,
      z: seg.cz + Math.sin(a) * CORNER,
      fx: -Math.sin(a),
      fz: Math.cos(a),
    };
  }

  // Roll: a quarter turn per corner, so a full lap is 360° and the loop closes
  // on itself with nothing left over.
  function rollAt(d) {
    d = ((d % total) + total) % total;
    let turns = 0;
    for (const g of segs) {
      if (g.kind !== "a") continue;
      if (d >= g.s0 + g.len) turns += 1;
      else if (d > g.s0) turns += (d - g.s0) / g.len;
    }
    return (turns * Math.PI) / 2;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const focal = Math.max(w, h) * FOCAL_K;

    // Camera frame. Heading is horizontal, so world up needs no fixing up;
    // the roll then turns that basis about the view axis.
    //
    // The camera aims at a point further down the path rather than along the
    // instantaneous tangent: in a bend the tangent points straight at the outer
    // wall, and the corridor disappears. Looking ahead into the turn keeps the
    // passage in frame, which is also what a player does.
    const c = at(s);
    const ahead = at(s + LEAD);
    const lx = ahead.x - c.x;
    const lz = ahead.z - c.z;
    const ll = Math.hypot(lx, lz) || 1;
    c.fx = lx / ll;
    c.fz = lz / ll;
    const roll = rollAt(s);
    const cr = Math.cos(roll);
    const sr = Math.sin(roll);
    // right = forward × up, with forward horizontal
    const rx = c.fz,
      rz = -c.fx;
    // Rolled basis: only the CAMERA rolls. The tunnel's own cross-sections stay
    // world-aligned, which is what makes the roll visible at all.
    const camRight = { x: rx * cr, y: sr, z: rz * cr };
    const camUp = { x: -rx * sr, y: cr, z: -rz * sr };

    const project = (p) => {
      const vx = p.x - c.x,
        vy = p.y,
        vz = p.z - c.z;
      const zc = vx * c.fx + vz * c.fz; // forward has no y component
      if (zc < 0.06) return null;
      const xc = vx * camRight.x + vy * camRight.y + vz * camRight.z;
      const yc = vx * camUp.x + vy * camUp.y + vz * camUp.z;
      return [w / 2 + (focal * xc) / zc, h / 2 - (focal * yc) / zc];
    };

    // A cross-section of the tube at arclength d, walked as 4 × TILES points
    // around the square, world aligned (up is world up, right is the path
    // normal). Subdividing in 3D and then projecting — rather than lerping the
    // projected corners — is what keeps the tile seams straight in perspective.
    const CORNERS = [
      [-1, 1],
      [1, 1],
      [1, -1],
      [-1, -1],
    ];
    const ring = (d) => {
      const p = at(d);
      const nx = p.fz,
        nz = -p.fx;
      const out = [];
      for (let i = 0; i < 4; i++) {
        const a = CORNERS[i];
        const b = CORNERS[(i + 1) % 4];
        for (let t = 0; t < TILES; t++) {
          const u = t / TILES;
          const su = a[0] + (b[0] - a[0]) * u;
          const sv = a[1] + (b[1] - a[1]) * u;
          out.push(
            project({
              x: p.x + nx * R * su,
              y: R * sv,
              z: p.z + nz * R * su,
            }),
          );
        }
      }
      return out;
    };

    const N = 4 * TILES;
    ctx.lineWidth = 1;
    // Far to near, so nearer panels paint over the ones behind them.
    let far = ring(s + D_FAR);
    for (let d = D_FAR - STEP; d >= D_NEAR; d -= STEP) {
      const near = ring(s + d);
      const k = 1 - (d - D_NEAR) / (D_FAR - D_NEAR);
      ctx.globalAlpha = 0.12 + 0.88 * k * k;
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N;
        const a = far[i],
          b = far[j],
          cc = near[j],
          dd = near[i];
        if (!a || !b || !cc || !dd) continue;
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.lineTo(cc[0], cc[1]);
        ctx.lineTo(dd[0], dd[1]);
        ctx.closePath();
        ctx.fillStyle = TILE_FILL[i];
        ctx.fill();
        ctx.strokeStyle = SEAM;
        ctx.stroke();
      }
      far = near;
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000 || 0, 0.05);
    last = now;
    s += SPEED * dt;
    draw();
  }

  function start() {
    if (raf) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  resize();

  if (reduced) {
    draw(); // one still frame: the tunnel is there, it just does not move
    window.addEventListener("resize", () => {
      resize();
      draw();
    });
    return;
  }

  window.addEventListener("resize", resize, { passive: true });

  new IntersectionObserver(
    (entries) => {
      for (const e of entries) (e.isIntersecting ? start : stop)();
    },
    { threshold: 0.05 },
  ).observe(canvas);

  document.addEventListener("visibilitychange", () =>
    document.hidden ? stop() : start(),
  );
}

for (const c of document.querySelectorAll("[data-tunnel]")) startTunnel(c);
