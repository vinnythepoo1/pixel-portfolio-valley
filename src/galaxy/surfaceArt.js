import { makeTex, framesTex, rng, shade, ensureAnim, ditherLevel } from '../art/canvas.js';

// Astronaut, side view facing right, 18x26.
// Frames: 0-1 idle (breathing), 2-9 walk cycle, 10 jump (rising), 11 fall.
export const ASTRO = { idle: [0, 1], walk: [2, 3, 4, 5, 6, 7, 8, 9], jump: 10, fall: 11 };
export function genAstronaut(scene) {
  const C = {
    hi: '#ffffff', suit: '#eef0f6', mid: '#c9cedf', dark: '#9097b0', deep: '#6a7088',
    pack: '#a8aec4', packDark: '#767c96', orange: '#ff8a3a', gold: '#ffd75e',
    visorTop: '#9fe0ff', visor: '#3f78c0', visorDark: '#1f3a6e',
  };
  framesTex(scene, 'astro', 18, 26, 12, (g, f) => {
    let bob = 0, legA = 0, legB = 0, liftA = 0, liftB = 0, armA = 0, armB = 0, armUp = 0;
    if (f <= 1) { bob = f; legA = 2; legB = -2; armA = 0; armB = -2; } // idle: planted stance, breathing
    else if (f <= 9) {
      const a = ((f - 2) / 8) * Math.PI * 2;
      legA = Math.round(Math.sin(a) * 3); legB = -legA;
      liftA = Math.cos(a) > 0.3 ? 1 : 0; liftB = Math.cos(a) < -0.3 ? 1 : 0;
      bob = Math.abs(Math.sin(a)) > 0.7 ? 1 : 0;
      armA = -Math.round(Math.sin(a) * 2); armB = -armA;
    } else if (f === 10) { legA = 2; legB = -1; liftA = 3; liftB = 1; armUp = 3; armA = 1; armB = -1; }
    else { legA = 2; legB = -2; armUp = 1; armA = 2; armB = -2; }

    const leg = (dx, lift, front) => {
      const x = 7 + dx;
      g.r(x, 19, 3, 4 - lift, front ? C.suit : C.mid);
      g.r(x + 2, 19, 1, 4 - lift, front ? C.mid : C.dark);
      g.r(x - (front ? 0 : 0), 23 - lift, 4, 2, front ? C.dark : C.deep);
      g.r(x, 23 - lift, 4, 1, front ? C.mid : C.dark);
    };
    const arm = (dx, front) => {
      const x = 9 + dx, y = 12 + bob - armUp;
      g.r(x, y, 2, 5, front ? C.suit : C.mid);
      g.r(x + 1, y, 1, 5, front ? C.mid : C.dark);
      g.r(x, y + 5, 2, 2, front ? C.dark : C.deep);
    };
    // back limbs first
    arm(armB, false);
    leg(legB, liftB, false);
    // backpack
    g.r(2, 9 + bob, 4, 9, C.pack); g.r(2, 9 + bob, 4, 1, C.suit); g.r(2, 17 + bob, 4, 1, C.packDark); g.r(5, 10 + bob, 1, 7, C.packDark);
    g.r(3, 12 + bob, 2, 2, C.orange); g.p(3, 12 + bob, C.gold);
    // torso
    g.r(5, 11 + bob, 9, 8 - bob, C.suit); g.r(5, 11 + bob, 9, 1, C.hi); g.r(12, 12 + bob, 2, 7 - bob, C.mid);
    g.r(5, 18, 9, 1, C.dark);
    g.r(8, 13 + bob, 3, 2, C.orange); g.p(8, 13 + bob, C.gold); g.p(12, 14 + bob, '#5aff8a');
    // helmet
    g.circle(10, 6 + bob, 5, C.mid);
    g.circle(9, 5 + bob, 4, C.suit);
    g.r(7, 2 + bob, 3, 1, C.hi); g.p(6, 3 + bob, C.hi);
    // visor
    g.r(10, 3 + bob, 5, 6, C.visor); g.r(11, 2 + bob, 3, 1, C.visor);
    g.r(10, 3 + bob, 5, 1, C.visorTop); g.r(10, 7 + bob, 5, 2, C.visorDark); g.r(14, 4 + bob, 1, 4, C.visorDark);
    g.r(11, 4 + bob, 2, 1, C.hi); g.p(11, 5 + bob, C.visorTop);
    g.r(10, 10 + bob, 5, 1, C.dark); // collar ring
    // antenna light
    g.r(6, 0 + bob, 1, 2, C.dark); g.p(6, 0 + bob, f % 4 < 2 ? '#ff5a5a' : '#ffb0b0');
    // front limbs on top
    leg(legA, liftA, true);
    arm(armA, true);
  }, { outlineColor: '#120c2a' });
  ensureAnim(scene, 'astro-walk', 'astro', ASTRO.walk, 14);
  ensureAnim(scene, 'astro-idle', 'astro', ASTRO.idle, 2);
}

// Sky gradient, distant hills, clouds, ground and platform textures for one planet.
export function genSurface(scene, id, s) {
  const toRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const css = (c) => `rgb(${c.join(',')})`;
  const mixC = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const [skyTop, skyBot] = s.sky.map(toRgb);

  // Banded sky: 10 colour bands joined by alternating-line dither (survives the horizontal stretch),
  // with a pale glow just above the horizon.
  makeTex(scene, `sky_${id}`, 4, 300, (g) => {
    const BANDS = 10;
    for (let y = 0; y < 300; y++) {
      const t = Math.min(1, y / 250) * (BANDS - 1);
      let b = Math.floor(t);
      const frac = t - b;
      if (frac > 0.66 || (frac > 0.33 && y % 2 === 0)) b += 1;
      let c = mixC(skyTop, skyBot, Math.min(1, b / (BANDS - 1)));
      if (y > 200) c = mixC(c, [255, 255, 255], Math.min(0.28, (y - 200) / 180));
      g.r(0, y, 4, 1, css(c));
    }
  });

  // Soft pixel clouds that drift across the sky.
  makeTex(scene, `clouds_${id}`, 512, 90, (g) => {
    const R = rng(id.length * 11 + 2);
    const lit = css(mixC(skyBot, [255, 255, 255], 0.75)), body = css(mixC(skyBot, [255, 255, 255], 0.5)), under = css(mixC(skyBot, skyTop, 0.35));
    for (let i = 0; i < 7; i++) {
      const cx = Math.floor(R() * 460) + 26, cy = 20 + Math.floor(R() * 50), n = 3 + Math.floor(R() * 3);
      const puffs = Array.from({ length: n }, (_, k) => [cx + (k - n / 2) * 9 + Math.floor(R() * 5), cy - Math.floor(R() * 6), 6 + Math.floor(R() * 6)]);
      for (const [x, y, r] of puffs) g.ellipse(x, y + 2, r + 1, Math.round(r * 0.6) + 1, under);
      for (const [x, y, r] of puffs) g.ellipse(x, y, r, Math.round(r * 0.6), body);
      for (const [x, y, r] of puffs) g.ellipse(x - 2, y - 2, Math.max(2, r - 4), Math.max(1, Math.round(r * 0.3)), lit);
      g.r(cx - n * 5, cy + 4, n * 10, 2, under);
    }
  });

  // Layered hills: lit ridge, dithered shading toward the base, haze that blends far hills into the sky.
  const hills = (key, w, h, color, amp, freq, seed, jag, haze) =>
    makeTex(scene, key, w, h, (g) => {
      const R = rng(seed), p1 = R() * 9, p2 = R() * 9, p3 = R() * 9;
      const base = mixC(toRgb(color), skyBot, haze);
      const top = mixC(base, [255, 255, 255], 0.22), mid = base, low = mixC(base, [20, 14, 50], 0.22), deep = mixC(base, [20, 14, 50], 0.4);
      for (let x = 0; x < w; x++) {
        const k = (x / w) * Math.PI * 2;
        let y = h * 0.45 + amp * (Math.sin(k * freq + p1) * 0.6 + Math.sin(k * freq * 3 + p2) * 0.3 + Math.sin(k * freq * 7 + p3) * 0.1);
        if (jag) y += (x % 9 < 4 ? -1 : 1) * 2;
        y = Math.round(y);
        const slopeLit = Math.sin(k * freq + p1 + 1.6) > 0; // sun-facing slopes get a thicker highlight
        for (let yy = y; yy < h; yy++) {
          const dpt = yy - y;
          let c = mid;
          if (dpt < (slopeLit ? 3 : 1)) c = top;
          else {
            const t = (yy - y) / (h - y + 1) * 3;
            const lv = ditherLevel(t, x, yy, 2.2);
            c = lv <= 0 ? mid : lv === 1 ? low : deep;
          }
          g.p(x, yy, css(c));
        }
        g.p(x, y, css(mixC(top, [255, 255, 255], 0.3)));
      }
    });
  hills(`far_${id}`, 512, 120, s.far, 26, 2, id.length * 3, true, 0.35);
  hills(`mid_${id}`, 512, 90, s.mid, 16, 3, id.length * 5 + 1, false, 0.12);

  // Ground: grassy lip with hanging tufts, soil strata and pebbles. 64 px wide so the tiling is less obvious.
  makeTex(scene, `gnd_${id}`, 64, 64, (g) => {
    const R = rng(id.length);
    const soil = toRgb(s.ground), grass = toRgb(s.top);
    const strata = [mixC(soil, [255, 255, 255], 0.06), soil, mixC(soil, [20, 14, 50], 0.18), mixC(soil, [20, 14, 50], 0.32)];
    for (let y = 0; y < 64; y++) {
      const band = Math.min(3, Math.floor((y + Math.sin(y * 0.7) * 2) / 16));
      g.r(0, y, 64, 1, css(strata[band]));
    }
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(R() * 62), y = 10 + Math.floor(R() * 52);
      if (R() < 0.5) { g.r(x, y, 2, 1, css(mixC(soil, [255, 255, 255], 0.18))); g.p(x, y + 1, css(mixC(soil, [20, 14, 50], 0.35))); }
      else g.p(x, y, css(mixC(soil, [20, 14, 50], 0.25)));
    }
    for (let i = 0; i < 6; i++) { const x = Math.floor(R() * 60), y = 18 + Math.floor(R() * 40); g.r(x, y, 3, 2, css(mixC(soil, [255, 255, 255], 0.25))); g.r(x, y + 2, 3, 1, css(mixC(soil, [20, 14, 50], 0.4))); g.p(x, y, css(mixC(soil, [255, 255, 255], 0.45))); }
    g.r(0, 0, 64, 4, css(grass));
    g.r(0, 0, 64, 1, css(mixC(grass, [255, 255, 255], 0.35)));
    for (let x = 0; x < 64; x++) {
      const hang = 4 + ((x * 7 + (x >> 2) * 3) % 5 === 0 ? 3 : (x * 5) % 3 === 0 ? 1 : 0);
      g.r(x, 4, 1, hang - 4, css(grass));
      g.p(x, hang, css(mixC(grass, [20, 14, 50], 0.35)));
    }
    for (let x = 2; x < 64; x += 7) g.p(x, 1, css(mixC(grass, [255, 255, 255], 0.55)));
  });
  makeTex(scene, `plat_${id}`, 48, 12, (g) => {
    const soil = toRgb(s.ground), grass = toRgb(s.top);
    g.r(0, 0, 48, 4, css(grass)); g.r(0, 0, 48, 1, css(mixC(grass, [255, 255, 255], 0.35)));
    g.r(2, 4, 44, 4, css(soil)); g.r(8, 8, 32, 2, css(mixC(soil, [20, 14, 50], 0.2))); g.r(16, 10, 16, 2, css(mixC(soil, [20, 14, 50], 0.35)));
    g.r(0, 4, 48, 1, css(mixC(grass, [20, 14, 50], 0.35)));
    for (let x = 3; x < 46; x += 5) g.p(x, 5 + (x % 3), css(mixC(soil, [255, 255, 255], 0.2)));
  }, { outlined: true });

  // Dark foreground grass and pebbles that scroll faster than the stage, for depth.
  makeTex(scene, `fg_${id}`, 512, 32, (g) => {
    const R = rng(id.length * 7 + 5);
    const dark = css(mixC(toRgb(s.ground), [12, 8, 34], 0.6)), darker = css(mixC(toRgb(s.ground), [12, 8, 34], 0.78));
    g.r(0, 26, 512, 6, darker);
    for (let i = 0; i < 70; i++) {
      const x = Math.floor(R() * 512), hgt = 4 + Math.floor(R() * 16), lean = R() < 0.5 ? -1 : 1;
      for (let y = 0; y < hgt; y++) g.p(x + Math.round(lean * (y / hgt) ** 2 * 3), 31 - y, y < hgt * 0.4 ? darker : dark);
    }
    for (let i = 0; i < 9; i++) { const x = Math.floor(R() * 500); g.ellipse(x, 28, 5 + Math.floor(R() * 5), 3, darker); g.r(x - 2, 26, 3, 1, dark); }
  });
  for (const p of s.props) genProp(scene, p, id, s);
}

const mixHex = (a, b, t) => [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');

// Themed decorations. Each returns a texture key `prop_<type>_<id>`.
function genProp(scene, type, id, s) {
  const key = `prop_${type}_${id}`;
  const top = s.top, dark = shade(s.ground, -0.2);
  const draw = {
    potion: [16, 26, (g) => { g.r(6, 0, 4, 3, '#c8b48a'); g.r(5, 3, 6, 3, '#d8ecef'); g.r(2, 6, 12, 18, '#d8ecef'); g.r(3, 12, 10, 11, '#ff6aa0'); g.r(4, 13, 2, 6, '#ffd1e0'); }],
    mushroom: [18, 20, (g) => { g.r(7, 9, 4, 11, '#f1e6c8'); g.ellipse(9, 8, 8, 5, top); g.p(5, 6, '#ffffff'); g.p(11, 5, '#ffffff'); g.p(13, 8, '#ffffff'); }],
    flower: [12, 22, (g) => { g.r(5, 8, 2, 14, '#3f7a3a'); g.r(2, 13, 3, 2, '#5fae4c'); g.r(7, 16, 3, 2, '#5fae4c'); g.circle(6, 5, 4, top); g.circle(6, 5, 1, '#ffe27a'); }],
    crate: [18, 18, (g) => { g.r(0, 0, 18, 18, '#b07a44'); g.r(0, 0, 18, 2, '#c99158'); g.r(0, 0, 2, 18, '#8a5a32'); g.r(16, 0, 2, 18, '#8a5a32'); g.line(2, 15, 15, 2, '#7a5432'); }],
    rock: [22, 14, (g) => { g.ellipse(11, 8, 10, 6, shade(s.mid, -0.1)); g.ellipse(9, 6, 6, 3, shade(s.mid, 0.15)); }],
    cactus: [14, 26, (g) => { g.r(5, 2, 4, 24, '#5f9a4a'); g.r(1, 8, 3, 8, '#5f9a4a'); g.r(1, 14, 5, 2, '#5f9a4a'); g.r(10, 6, 3, 8, '#5f9a4a'); g.r(8, 12, 5, 2, '#5f9a4a'); g.r(6, 3, 1, 22, '#7cc062'); }],
    mailbox: [12, 24, (g) => { g.r(5, 10, 2, 14, '#6b4a2f'); g.r(1, 2, 10, 9, '#c0453a'); g.r(2, 1, 8, 1, '#d8604a'); g.r(3, 5, 6, 1, '#6a2020'); g.r(10, 3, 2, 3, '#ffd75e'); }],
    parcel: [16, 14, (g) => { g.r(0, 2, 16, 12, '#c99158'); g.r(7, 2, 2, 12, '#7a5432'); g.r(0, 7, 16, 1, '#7a5432'); g.r(4, 0, 8, 2, '#d9a86a'); }],
    pine: [20, 34, (g) => { g.r(9, 28, 3, 6, '#5b3a22'); for (let i = 0; i < 3; i++) for (let y = 0; y < 12; y++) { const w = Math.round(2 + y * 0.7 + i); g.r(10 - w, i * 8 + y, w * 2 + 1, 1, y < 2 ? shade(s.mid, 0.25) : shade(s.mid, -0.15)); } }],
    stall: [34, 30, (g) => { g.r(2, 8, 2, 22, '#6b4a2f'); g.r(30, 8, 2, 22, '#6b4a2f'); for (let x = 0; x < 34; x += 6) g.r(x, 0, 6, 9, (x / 6) % 2 ? '#f3e6c8' : '#c4473a'); g.r(0, 18, 34, 4, '#c08a55'); g.r(1, 22, 32, 8, '#9c6b3c'); for (let i = 0; i < 8; i++) g.r(3 + i * 4, 15, 3, 3, ['#ffd75e', '#d8453a', '#7cc062', '#4f97cf'][i % 4]); }],
    coinpile: [20, 12, (g) => { for (let i = 0; i < 9; i++) g.r(1 + (i % 5) * 4 - (i > 4 ? -2 : 0), 8 - Math.floor(i / 5) * 4, 4, 4, i % 2 ? '#ffd75e' : '#e2b23a'); }],
    palm: [26, 40, (g) => { for (let y = 8; y < 40; y++) g.r(12 + Math.round(Math.sin(y / 6) * 2), y, 3, 1, '#8a5a32'); for (const [dx, dy] of [[-10, 2], [10, 2], [-8, -4], [8, -4], [0, -6]]) g.line(13, 8, 13 + dx, 8 + dy + 6, '#5fae4c'); g.circle(13, 8, 3, '#4f8a3a'); }],
    banner: [14, 36, (g) => { g.r(1, 0, 2, 36, '#5b4a3a'); g.r(3, 2, 10, 16, '#a0413a'); g.r(6, 6, 4, 6, '#ffd75e'); g.r(3, 18, 4, 3, '#a0413a'); g.r(9, 18, 4, 3, '#a0413a'); }],
    lantern: [10, 32, (g) => { g.r(4, 8, 2, 24, '#3b3b44'); g.r(1, 1, 8, 1, '#3b3b44'); g.r(2, 2, 6, 7, '#3b3b44'); g.r(3, 3, 4, 5, '#ffcf6e'); }],
    house: [36, 32, (g) => { g.r(4, 14, 28, 18, '#e9d7a8'); for (let y = 0; y < 14; y++) g.r(18 - y * 1.3 - 2, y, (y * 1.3 + 2) * 2, 1, '#c2643a'); g.r(16, 22, 6, 10, '#6b4a2f'); g.r(7, 18, 6, 5, '#ffcf6e'); g.r(24, 18, 6, 5, '#ffcf6e'); }],
    bike: [24, 16, (g) => { g.circle(5, 10, 5, '#2a1c14'); g.circle(18, 10, 5, '#2a1c14'); g.circle(5, 10, 3, s.sky[1]); g.circle(18, 10, 3, s.sky[1]); g.line(5, 10, 10, 4, '#c0392b'); g.line(10, 4, 18, 4, '#c0392b'); g.line(18, 10, 17, 3, '#c0392b'); g.line(5, 10, 12, 10, '#c0392b'); g.r(8, 2, 4, 1, '#3b2a1e'); }],
    tree: [28, 40, (g) => { g.r(12, 24, 4, 16, '#6b4a2f'); g.circle(14, 14, 12, shade(s.mid, -0.1)); g.circle(12, 12, 9, s.mid); g.circle(9, 9, 4, shade(s.mid, 0.25)); }],
    crystal: [16, 28, (g) => { for (let y = 0; y < 28; y++) { const w = Math.round(Math.min(y, 28 - y) * 0.45) + 1; g.r(8 - w, y, w * 2, 1, y < 14 ? '#c9b8ff' : '#9f7cff'); } g.r(7, 3, 1, 20, '#ffffff'); }],
    book: [16, 12, (g) => { g.r(0, 2, 16, 10, '#5b3f8c'); g.r(1, 0, 7, 10, '#f3ead2'); g.r(8, 0, 7, 10, '#e6dabb'); g.r(2, 3, 4, 1, '#a89878'); g.r(9, 3, 4, 1, '#a89878'); }],
    obelisk: [14, 42, (g) => { g.r(3, 6, 8, 36, '#3f2d6a'); g.r(4, 2, 6, 4, '#3f2d6a'); g.r(6, 0, 2, 2, '#3f2d6a'); g.r(6, 10, 2, 2, '#7fe0ff'); g.r(6, 18, 2, 2, '#7fe0ff'); g.r(6, 26, 2, 2, '#7fe0ff'); g.r(3, 6, 2, 36, '#5b3f8c'); }],
    fern: [24, 18, (g) => { for (let i = 0; i < 5; i++) g.line(12, 17, 2 + i * 5, 2 + Math.abs(2 - i) * 3, i % 2 ? '#3f8a4a' : '#5fae4c'); }],
    herb: [16, 20, (g) => { g.r(7, 8, 2, 12, '#3f7a3a'); for (let y = 2; y < 16; y += 4) { g.r(2, y, 5, 2, '#5fd0b0'); g.r(9, y + 2, 5, 2, '#5fd0b0'); } g.r(6, 0, 4, 3, '#b9a6f2'); }],
    mortar: [20, 14, (g) => { g.ellipse(10, 9, 9, 4, '#9a9a9a'); g.ellipse(10, 6, 9, 2, '#b5b5b5'); g.ellipse(10, 6, 6, 1, '#7cc062'); g.line(14, 0, 16, 6, '#7a5432'); }],
  }[type];
  if (!draw) return null;
  const [w, h, fn] = draw;
  const outlineColor = '#' + mixHex(s.ground, '#0b0a22', 0.65);
  makeTex(scene, key, w, h, (g) => fn(g), { outlined: true, bevelled: true, outlineColor });
  return key;
}

// Interactive structures shared by every planet.
export function genStructures(scene) {
  const NAVY = '#120c2a';
  framesTex(scene, 'terminal', 24, 32, 4, (g, f) => {
    // post and base
    g.r(9, 19, 6, 11, '#5b5b78'); g.r(9, 19, 2, 11, '#7c7c9c'); g.r(14, 19, 1, 11, '#3b3b54');
    g.r(4, 29, 16, 3, '#3b3b54'); g.r(4, 29, 16, 1, '#6a6a88');
    // housing
    g.r(0, 0, 24, 20, '#3f3f60'); g.r(0, 0, 24, 1, '#6a6a90'); g.r(0, 0, 1, 20, '#5a5a80'); g.r(23, 0, 1, 20, '#26263e'); g.r(0, 19, 24, 1, '#26263e');
    // screen with scanlines and scrolling text
    g.r(2, 2, 20, 15, '#0e3a2c');
    for (let y = 2; y < 17; y += 2) g.r(2, y, 20, 1, '#124634');
    for (let i = 0; i < 4; i++) {
      const y = 4 + i * 3, len = 5 + ((i * 7 + f * 5) % 11);
      g.r(4, y, len, 1, i === (f % 4) ? '#d0ffe4' : '#5fffa8');
    }
    g.r(4 + ((f * 3) % 12), 15, 2, 1, '#d0ffe4'); // cursor
    g.r(2, 2, 20, 1, '#2f7a5a'); g.p(3, 3, '#7fffb0');
    // buttons
    g.r(18, 21, 2, 2, f % 2 ? '#5aff8a' : '#2a6a3a'); g.r(4, 21, 4, 1, '#ffd75e');
  }, { outlineColor: NAVY });
  ensureAnim(scene, 'terminal', 'terminal', [0, 1, 2, 3], 3);

  framesTex(scene, 'monolith', 26, 48, 4, (g, f) => {
    g.r(3, 6, 20, 40, '#2a2a46'); g.r(5, 3, 16, 3, '#2a2a46'); g.r(8, 1, 10, 2, '#2a2a46');
    g.r(3, 6, 3, 40, '#46466e'); g.r(5, 3, 3, 3, '#46466e'); g.r(20, 6, 3, 40, '#1a1a30');
    g.r(3, 44, 20, 2, '#1a1a30'); g.r(1, 46, 24, 2, '#3b3b54'); g.r(1, 46, 24, 1, '#5b5b78');
    // glowing rune channel
    const pulse = ['#7f5cff', '#9f7cff', '#c9b8ff', '#9f7cff'][f];
    g.r(12, 8, 2, 34, '#1a1240'); for (let y = 8; y < 42; y += 4) g.r(12, y + ((y / 4 + f) % 2), 2, 2, pulse);
    const icons = ['#ffd75e', '#7fe0ff', '#ff8fb8', '#7cc062'];
    icons.forEach((c, i) => { g.r(7, 11 + i * 8, 4, 4, c); g.p(7, 11 + i * 8, '#ffffff'); g.r(8, 14 + i * 8, 3, 1, shade(c, -0.35)); g.r(16, 11 + i * 8, 3, 4, (i + f) % 4 === 0 ? '#ffffff' : shade(c, -0.2)); });
  }, { outlineColor: NAVY });
  ensureAnim(scene, 'monolith', 'monolith', [0, 1, 2, 3], 4);

  framesTex(scene, 'beacon', 30, 70, 4, (g, f) => {
    // lattice tower with lit left legs
    g.line(15, 10, 3, 66, '#c7cbe0'); g.line(15, 10, 27, 66, '#7c84a0'); g.line(15, 10, 15, 66, '#9aa0b8');
    for (let y = 18; y < 66; y += 8) { const half = (y - 10) / 4.7; g.line(15 - half, y, 15 + half, y + 8 > 66 ? 66 : y + 8, '#7c84a0'); g.r(15 - half, y, half * 2, 1, '#9aa0b8'); }
    // lamp housing
    g.r(10, 8, 11, 4, '#3b3b54'); g.r(10, 8, 11, 1, '#5b5b78');
    g.circle(15, 5, 5, '#2a2a46');
    g.circle(15, 5, 3, ['#ffd75e', '#ffefb0', '#ffffff', '#ffb347'][f]);
    g.p(14, 3, '#ffffff');
    // base slab
    g.r(0, 66, 30, 4, '#5b5b78'); g.r(0, 66, 30, 1, '#8a8aa8'); g.r(4, 68, 4, 1, '#ffd75e'); g.r(22, 68, 4, 1, '#ffd75e');
  }, { outlineColor: NAVY });
  ensureAnim(scene, 'beacon', 'beacon', [0, 1, 2, 3], 5);

  makeTex(scene, 'pad', 64, 8, (g) => {
    g.r(0, 2, 64, 6, '#5b5b78'); g.r(0, 2, 64, 1, '#9aa0b8'); g.r(0, 7, 64, 1, '#3b3b54');
    for (let x = 4; x < 64; x += 10) { g.r(x, 4, 6, 2, '#ffd75e'); g.r(x + 4, 4, 2, 2, '#2a2a46'); }
    g.r(1, 0, 2, 2, '#ff5a5a'); g.r(61, 0, 2, 2, '#ff5a5a');
  }, { outlined: true, outlineColor: NAVY });

  // the landed ship matches the flying ship's colours
  makeTex(scene, 'landedship', 24, 32, (g) => {
    for (let y = 0; y < 24; y++) {
      const w = Math.min(12, Math.round(2 + y * 0.85)), x0 = 12 - Math.ceil(w / 2);
      g.r(x0, y, w, 1, '#d5dae8'); g.r(x0, y, Math.max(1, Math.round(w * 0.35)), 1, '#ffffff'); g.r(x0 + w - 2, y, 2, 1, '#9aa2bb');
    }
    g.r(10, 15, 4, 8, '#d8473c'); g.r(10, 15, 1, 8, '#ff8a6a');
    g.r(9, 6, 6, 5, '#1d3f7a'); g.r(9, 6, 6, 2, '#3f8ad8'); g.r(10, 6, 2, 1, '#ffffff');
    // fins
    g.r(1, 17, 5, 12, '#d8473c'); g.r(1, 17, 2, 12, '#ff8a6a'); g.r(18, 17, 5, 12, '#b23a36'); g.r(21, 17, 2, 12, '#8e2a2e');
    g.r(7, 24, 10, 5, '#5b5b78'); g.r(7, 24, 10, 1, '#7c7c9c');
    g.r(6, 29, 4, 3, '#3b3b54'); g.r(14, 29, 4, 3, '#3b3b54'); g.r(7, 29, 2, 1, '#7fe0ff'); g.r(15, 29, 2, 1, '#7fe0ff');
  }, { outlined: true, outlineColor: NAVY });

  // tinted per planet, so it is drawn in light greys
  makeTex(scene, 'critter', 12, 10, (g) => {
    g.ellipse(6, 6, 5, 3, '#d8d8e0'); g.ellipse(5, 5, 4, 2, '#ffffff'); g.r(2, 8, 8, 1, '#a8a8b8');
    g.r(3, 1, 1, 3, '#d8d8e0'); g.r(8, 1, 1, 3, '#d8d8e0'); g.p(3, 0, '#ffffff'); g.p(8, 0, '#ffffff');
    g.r(3, 4, 2, 2, '#ffffff'); g.p(4, 5, '#1a1240'); g.r(7, 4, 2, 2, '#ffffff'); g.p(8, 5, '#1a1240');
    g.p(2, 6, '#ffb0c8'); g.p(9, 6, '#ffb0c8');
    g.r(3, 9, 2, 1, '#a8a8b8'); g.r(7, 9, 2, 1, '#a8a8b8');
  }, { outlined: true, outlineColor: NAVY });

  // physics toys: a pushable crate and a bouncy star ball
  makeTex(scene, 'phys_box', 18, 18, (g) => {
    g.r(0, 0, 18, 18, '#a8743f'); g.r(0, 0, 18, 2, '#d9a86a'); g.r(0, 0, 2, 18, '#c99158'); g.r(16, 0, 2, 18, '#7a5432'); g.r(0, 16, 18, 2, '#6a4628');
    g.line(2, 15, 15, 2, '#7a5432'); g.line(3, 15, 15, 3, '#c99158');
    for (const [x, y] of [[2, 2], [14, 2], [2, 14], [14, 14]]) { g.r(x, y, 2, 2, '#9aa0b8'); g.p(x, y, '#dfe3ee'); }
  }, { outlined: true, outlineColor: NAVY });
  makeTex(scene, 'phys_ball', 16, 16, (g) => {
    g.circle(8, 8, 7, '#ff5a8a');
    g.r(1, 7, 14, 2, '#ffd75e'); g.r(7, 1, 2, 14, '#7fe0ff');
    g.circle(6, 5, 2, '#ffb0c8'); g.p(5, 4, '#ffffff');
    g.ellipse(9, 12, 4, 1, '#c8406a');
  }, { outlined: true, outlineColor: NAVY });

  // soft contact shadow and foreground dust
  makeTex(scene, 'shadow', 24, 6, (g) => { g.ellipse(12, 3, 11, 2, 'rgba(10,8,30,0.28)'); g.ellipse(12, 3, 7, 1, 'rgba(10,8,30,0.25)'); });
  makeTex(scene, 'puff', 8, 8, (g) => { g.circle(4, 4, 3, '#ffffff'); });
  makeTex(scene, 'dot', 2, 2, (g) => { g.r(0, 0, 2, 2, '#ffffff'); });
  makeTex(scene, 'streak', 10, 1, (g) => { g.r(0, 0, 10, 1, '#ffffff'); });
}
