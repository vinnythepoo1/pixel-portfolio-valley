import { makeTex, framesTex, rng, shade, hexToRgb, ensureAnim, bayer, mix, ditherLevel } from '../art/canvas.js';

// Space art is outlined in deep navy so sprites sit in the starfield instead of looking muddy.
const NAVY = '#0b0a22';

// ------------------------------------------------------------------ noise
function hash3(x, y, z, seed) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise3(x, y, z, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const s = (t) => t * t * (3 - 2 * t);
  const u = s(xf), v = s(yf), w = s(zf);
  let out = 0;
  for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
    const wgt = (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
    out += wgt * hash3(xi + dx, yi + dy, zi + dz, seed);
  }
  return out;
}
const fbm = (x, y, z, seed) => noise3(x, y, z, seed) * 0.6 + noise3(x * 2.1, y * 2.1, z * 2.1, seed + 7) * 0.3 + noise3(x * 4.3, y * 4.3, z * 4.3, seed + 13) * 0.1;
const fbm4 = (x, y, z, seed) => noise3(x, y, z, seed) * 0.5 + noise3(x * 2, y * 2, z, seed + 3) * 0.27 + noise3(x * 4, y * 4, z, seed + 5) * 0.15 + noise3(x * 8, y * 8, z, seed + 9) * 0.08;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const WHITE = [255, 255, 255];

// Draws per pixel: fn(x, y, frame) returns [r,g,b] or [r,g,b,a] or null. Builds `frames` frames side by side.
function pixTex(scene, key, w, h, fn, { frames = 1, outlineColor = null } = {}) {
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, w * frames, h);
  const ctx = tex.getContext();
  const img = ctx.createImageData(w * frames, h);
  const d = img.data;
  for (let f = 0; f < frames; f++) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = fn(x, y, f);
      if (!c) continue;
      const o = (y * w * frames + f * w + x) * 4;
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = c[3] ?? 255;
    }
  }
  if (outlineColor) {
    const [r, g, b] = hexToRgb(outlineColor);
    const W = w * frames;
    const solid = (x, y) => x >= 0 && y >= 0 && x < W && y < h && Math.floor(x / w) === Math.floor(xx / w) && d[(y * W + x) * 4 + 3] > 180;
    let xx = 0;
    const mark = [];
    for (let y = 0; y < h; y++) for (xx = 0; xx < W; xx++) {
      if (d[(y * W + xx) * 4 + 3] !== 0) continue;
      if (solid(xx - 1, y) || solid(xx + 1, y) || solid(xx, y - 1) || solid(xx, y + 1)) mark.push(y * W + xx);
    }
    for (const i of mark) { d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255; }
  }
  ctx.putImageData(img, 0, 0);
  if (frames > 1) for (let f = 0; f < frames; f++) tex.add(String(f), 0, f * w, 0, w, h);
  tex.refresh();
  return key;
}

// A 5-step colour ramp: warm highlight, base, cool shadow, deep shadow, night side.
function ramp(c) {
  return [
    mix(c, [255, 248, 225], 0.38),
    c,
    mix(c.map((v) => v * 0.74), [70, 52, 150], 0.2),
    mix(c.map((v) => v * 0.46), [42, 30, 110], 0.38),
    mix(c.map((v) => v * 0.2), [16, 12, 44], 0.55),
  ];
}

// ------------------------------------------------------------------ planets
const PAD = 4; // room for the atmosphere glow outside the disc
export const PLANET_FRAMES = 24;

// A rotating pixel planet with dithered lighting, clouds, atmosphere and (on terra worlds) city lights.
export function genPlanet(scene, key, size, look, seed, frames = PLANET_FRAMES) {
  if (scene.textures.exists(key)) return key;
  const S = size + PAD * 2;
  const [base, light, dark, accent] = look.c.map(hexToRgb);
  const cloud = [246, 246, 255];
  const R = [ramp(base), ramp(light), ramp(dark), ramp(accent), ramp(cloud), ramp(mix(accent, [10, 20, 70], 0.38)), ramp(mix(accent, WHITE, 0.32)), ramp(mix(light, WHITE, 0.6))];
  const T = { base: 0, light: 1, dark: 2, accent: 3, cloud: 4, deep: 5, shallow: 6, glint: 7 };
  const atmo = mix(light, [190, 225, 255], look.type === 'crystal' ? 0.1 : 0.4);
  const r = size / 2 - 0.5;
  const L = [-0.58, -0.42, 0.7];
  const hasClouds = look.type === 'terra' || look.type === 'ice';
  const storm = { lon: 1.3 + (seed % 5), lat: 0.32 };

  pixTex(scene, key, S, S, (x, y, f) => {
    const phase = (f / frames) * Math.PI * 2;
    const nx = (x + 0.5 - S / 2) / r, ny = (y + 0.5 - S / 2) / r;
    const dd = nx * nx + ny * ny;

    // atmosphere halo outside the disc, brighter on the lit side
    if (dd > 1) {
      const dist = Math.sqrt(dd);
      const out = (dist - 1) * r;
      if (out > PAD) return null;
      const litEdge = (nx * L[0] + ny * L[1]) / dist;
      const a = (1 - out / PAD) * clamp(litEdge * 0.9 + 0.55);
      const lv = ditherLevel(a * 3, x, y, 3);
      return lv <= 0 ? null : [...atmo, [0, 60, 120, 190][Math.min(3, lv)]];
    }

    const nz = Math.sqrt(1 - dd);
    const lon0 = Math.atan2(nx, nz), lat = Math.asin(ny);
    const lon = lon0 + phase;
    const cx = Math.cos(lon) * Math.cos(lat), cy = Math.sin(lat), cz = Math.sin(lon) * Math.cos(lat);
    const n = fbm(cx * 2.2 + 5, cy * 2.2 + 5, cz * 2.2 + 5, seed);
    let tone = T.base;
    let land = true;
    switch (look.type) {
      case 'bands': {
        const b = Math.sin(lat * 9 + n * 3.5);
        tone = b > 0.6 ? T.light : b < -0.55 ? T.dark : b < -0.2 ? T.base : b > 0.25 ? T.glint : T.base;
        if (b > 0.88) tone = T.light;
        if (n > 0.73) tone = T.accent;
        // a great storm that drifts with the bands
        let dl = ((lon - storm.lon) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
        const e = (dl / 0.42) ** 2 + ((lat - storm.lat) / 0.17) ** 2;
        if (e < 1) tone = e < 0.35 ? T.glint : T.accent;
        else if (e < 1.5) tone = T.dark;
        break;
      }
      case 'craters': {
        tone = n > 0.6 ? T.light : n < 0.37 ? T.dark : T.base;
        const c2 = noise3(cx * 6 + 1, cy * 6 + 1, cz * 6 + 1, seed + 3);
        if (c2 > 0.73 && c2 <= 0.77) tone = T.glint; // crater rim
        if (c2 > 0.77) tone = T.dark;
        if (c2 > 0.85) tone = T.accent;
        break;
      }
      case 'ice': {
        tone = n > 0.56 ? T.light : n < 0.36 ? T.dark : T.base;
        const crack = Math.abs(noise3(cx * 5, cy * 5, cz * 5, seed + 11) - 0.5);
        if (crack < 0.025) tone = T.dark;
        if (Math.abs(lat) > 1.0) tone = Math.abs(lat) > 1.15 ? T.cloud : T.accent;
        break;
      }
      case 'crystal': {
        const facet = Math.floor((lon * 3 + lat * 2 + n * 4) * 1.5);
        tone = [T.base, T.light, T.dark, T.base][((facet % 4) + 4) % 4];
        if (n > 0.7) tone = T.accent;
        if (n > 0.76) tone = T.glint;
        break;
      }
      default: { // terra: deep sea, shallows, beaches, land, mountains, ice caps
        land = n >= 0.47;
        tone = n < 0.4 ? T.deep : n < 0.47 ? (n > 0.445 ? T.shallow : T.accent) : n > 0.68 ? T.dark : n > 0.58 ? T.light : T.base;
        if (Math.abs(lat) > 1.12) { tone = T.cloud; land = false; }
      }
    }

    // clouds rotate faster than the ground
    if (hasClouds) {
      const lc = lon0 + phase * 2;
      const ccx = Math.cos(lc) * Math.cos(lat), ccz = Math.sin(lc) * Math.cos(lat);
      const cl = fbm(ccx * 2.6 + 9, cy * 4.2 + 9, ccz * 2.6 + 9, seed + 21);
      if (cl > (look.type === 'ice' ? 0.66 : 0.6)) { tone = T.cloud; land = false; }
    }

    const lit = nx * L[0] + ny * L[1] + nz * L[2];
    let level = clamp((0.92 - lit) / 1.25, 0, 1) * 4;
    let lv = Math.min(4, ditherLevel(level, x, y));
    // fresnel: thin bright rim along the lit limb
    if (dd > 0.8 && lit > 0.05 && lv > 0) lv -= 1;
    let c = R[tone][lv];
    // sun glint on the oceans
    if ((tone === T.deep || tone === T.accent || tone === T.shallow) && Math.hypot(nx + 0.38, ny + 0.3) < 0.16) c = mix(c, WHITE, 0.55);
    // atmosphere tint near the limb
    if (dd > 0.72 && lv < 4) c = mix(c, atmo, (dd - 0.72) * 1.2);
    // city lights on the night side
    if (look.type === 'terra' && land && lv === 4 && hash3(Math.round(cx * 22), Math.round(cy * 22), Math.round(cz * 22), seed) > 0.9) c = [255, 214, 120];
    return c;
  }, { frames });

  ensureAnim(scene, key, key, Array.from({ length: frames }, (_, i) => i), 6);
  return key;
}

// Planet rings with several bands and gaps, split into a back half and a front half.
export function genRing(scene, key, size, color) {
  const w = Math.round(size * 2.1), h = Math.round(size * 0.6);
  const c = hexToRgb(color);
  const bands = [[0.55, 0.62, 0.45], [0.62, 0.74, 0.85], [0.77, 0.8, 0.55], [0.8, 0.92, 1.0], [0.92, 1, 0.5]];
  for (const half of ['back', 'front']) {
    pixTex(scene, `${key}_${half}`, w, h, (x, y) => {
      const cx = w / 2, cy = h / 2;
      if (half === 'back' ? y + 0.5 > cy : y + 0.5 <= cy) return null;
      const e = Math.sqrt(((x + 0.5 - cx) / (w / 2)) ** 2 + ((y + 0.5 - cy) / (h / 2)) ** 2);
      const b = bands.find(([a, z]) => e >= a && e < z);
      if (!b) return null;
      const density = b[2] * (0.8 + Math.sin(e * 90) * 0.2);
      if (density < 0.75 && bayer(x, y) > density + 0.15) return null;
      let col = mix(c, density > 0.9 ? WHITE : [60, 46, 120], density > 0.9 ? 0.25 : 1 - density);
      // the back half is in the planet's shadow, the near edge catches the light
      if (half === 'back') col = mix(col, [30, 24, 70], 0.3);
      else if (x < cx) col = mix(col, WHITE, 0.12);
      return col;
    });
  }
}

// ------------------------------------------------------------------ everything else in space
export function genSpaceArt(scene) {
  // starfields: tiny dim dust, mid stars, bright crosses and a twinkle layer
  const STAR_COLS = [[255, 255, 255], [207, 216, 255], [255, 233, 196], [201, 184, 255], [159, 208, 255], [255, 200, 220]];
  const starLayer = (key, n, kind, seed) => {
    const R = rng(seed);
    const pts = new Map();
    const put = (x, y, c, a) => {
      const k = ((y + 512) % 512) * 512 + ((x + 512) % 512);
      const prev = pts.get(k);
      if (!prev || prev[3] < a) pts.set(k, [...c, a]);
    };
    for (let i = 0; i < n; i++) {
      const x = Math.floor(R() * 512), y = Math.floor(R() * 512);
      const c = STAR_COLS[Math.floor(R() * STAR_COLS.length)];
      if (kind === 'dust') put(x, y, c, 50 + Math.floor(R() * 120));
      else if (kind === 'mid') {
        put(x, y, c, 200 + Math.floor(R() * 55));
        if (R() < 0.3) { put(x - 1, y, c, 90); put(x + 1, y, c, 90); put(x, y - 1, c, 90); put(x, y + 1, c, 90); }
      } else {
        const arm = kind === 'twinkle' ? 3 : 2;
        put(x, y, WHITE, 255);
        for (let k = 1; k <= arm; k++) {
          const a = Math.round(230 * (1 - k / (arm + 1)));
          put(x - k, y, c, a); put(x + k, y, c, a); put(x, y - k, c, a); put(x, y + k, c, a);
        }
        put(x - 1, y - 1, c, 50); put(x + 1, y - 1, c, 50); put(x - 1, y + 1, c, 50); put(x + 1, y + 1, c, 50);
      }
    }
    pixTex(scene, key, 512, 512, (x, y) => pts.get(y * 512 + x) || null);
  };
  starLayer('stars1', 1100, 'dust', 1);
  starLayer('stars2', 220, 'mid', 2);
  starLayer('stars3', 34, 'bright', 3);
  starLayer('stars4', 14, 'twinkle', 4);

  // nebulae: two-tone clouds with dark dust lanes, dithered into a few alpha steps
  for (const [key, c1, c2, sd] of [['neb_harbor', '#9a78ff', '#ff6ec4', 3], ['neb_market', '#3fd8d0', '#4f7aff', 5], ['neb_herbal', '#ff6ea8', '#ffb347', 7]]) {
    const A = hexToRgb(c1), B = hexToRgb(c2);
    pixTex(scene, key, 320, 320, (x, y) => {
      const d = Math.hypot(x - 160, y - 160) / 160;
      if (d >= 1) return null;
      const n = fbm4(x / 52, y / 52, sd, sd);
      const warp = fbm4(x / 36 + n * 2, y / 36 - n * 2, sd + 1, sd + 4);
      let dens = (1 - d ** 1.6) * (n * 1.3 + warp * 0.5) - 0.42;
      dens *= 1 - clamp((fbm(x / 22, y / 22, sd, sd + 8) - 0.58) * 4) * 0.6; // dust lanes
      const lv = Math.min(4, ditherLevel(clamp(dens * 6, 0, 4), x, y, 2));
      if (lv <= 0) return null;
      let col = mix(A, B, clamp(warp * 1.6 - 0.4));
      if (lv === 4) col = mix(col, WHITE, 0.35);
      return [...col, [0, 30, 60, 100, 150][lv]];
    });
  }

  makeTex(scene, 'glow', 64, 64, (g, ctx) => {
    const grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,0.9)');
    grd.addColorStop(0.35, 'rgba(255,255,255,0.35)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 64, 64);
  });

  // the ship points right (rotation 0); light comes from the top-left
  pixTex(scene, 'ship', 30, 24, (x, y) => {
    const H = { hi: [255, 255, 255], a: [232, 236, 246], b: [200, 207, 226], c: [158, 167, 192], d: [112, 120, 150] };
    // canopy
    const ce = ((x - 18.5) / 3.4) ** 2 + ((y - 9.8) / 2.2) ** 2;
    if (ce < 1) {
      if ((x === 17 || x === 18) && y === 9) return WHITE;
      return y < 9 ? [143, 220, 255] : ce < 0.5 ? [63, 138, 216] : [29, 63, 122];
    }
    // engine block and glowing nozzles
    if (x >= 2 && x <= 6 && y >= 8 && y <= 15) {
      if (x <= 3 && (y === 9 || y === 10 || y === 13 || y === 14)) return x === 2 ? [127, 224, 255] : WHITE;
      return y <= 9 ? [106, 106, 136] : y >= 14 ? [51, 51, 74] : [74, 74, 98];
    }
    // hull
    if (y >= 7 && y <= 16) {
      const t = Math.abs(y - 11.5) / 5;
      const xe = Math.round(28 - t * t * 15), xs = 6 + Math.round(t * 2);
      if (x >= xs && x <= xe) {
        if (y === 13 && x >= 8 && x <= xe - 3) return x > xe - 6 ? [255, 138, 106] : [216, 71, 60]; // racing stripe
        if (x === 12 && y >= 9 && y <= 14) return H.c; // panel seam
        if (x === xe && y <= 11) return H.hi;
        return y <= 8 ? H.hi : y <= 10 ? H.a : y <= 12 ? H.b : y <= 14 ? H.c : H.d;
      }
    }
    // swept wings: top wing lit, bottom wing in shadow
    const wing = (row, lit) => {
      const xs = Math.round(5 + row * 0.5), xe = Math.round(9 + row * 1.7);
      if (x < xs || x > xe) return null;
      const pal = lit ? [[255, 138, 106], [216, 71, 60], [142, 42, 46]] : [[226, 98, 80], [178, 56, 52], [110, 30, 40]];
      if (x >= xe - 1) return pal[0];
      if (x === xs) return pal[2];
      if (row === 0) return pal[0];
      return pal[1];
    };
    if (y >= 1 && y <= 6) return wing(y - 1, true);
    if (y >= 17 && y <= 22) return wing(22 - y, false);
    return null;
  }, { outlineColor: NAVY });

  makeTex(scene, 'bolt', 12, 3, (g) => { g.r(0, 0, 12, 3, '#ff8a3a'); g.r(3, 0, 9, 3, '#ffb347'); g.r(4, 1, 8, 1, '#fff6d0'); g.p(11, 1, '#ffffff'); });
  makeTex(scene, 'spark', 3, 3, (g) => { g.r(0, 0, 3, 3, '#ffffff'); });
  makeTex(scene, 'dust', 5, 5, (g) => { g.r(1, 0, 3, 5, '#ffd75e'); g.r(0, 1, 5, 3, '#ffd75e'); g.r(3, 2, 1, 2, '#c8902a'); g.p(1, 1, '#fffbe0'); }, { outlined: true, outlineColor: NAVY });
  makeTex(scene, 'arrow', 9, 9, (g) => { for (let i = 0; i < 5; i++) g.r(i, 4 - i, 1, i * 2 + 1, '#ffd75e'); g.r(5, 3, 3, 3, '#ffd75e'); g.r(1, 4, 6, 1, '#fff2b0'); }, { outlined: true, outlineColor: NAVY });
  makeTex(scene, 'promptE', 13, 14, (g) => {
    g.r(1, 0, 11, 11, '#fffaf0'); g.r(0, 1, 13, 9, '#fffaf0'); g.r(1, 9, 11, 1, '#d8d0e8'); g.r(5, 11, 3, 1, '#fffaf0'); g.p(6, 12, '#fffaf0');
    g.r(4, 2, 1, 7, '#2a1c14'); g.r(4, 2, 5, 1, '#2a1c14'); g.r(4, 5, 4, 1, '#2a1c14'); g.r(4, 8, 5, 1, '#2a1c14');
  }, { outlined: true, outlineColor: NAVY });

  framesTex(scene, 'crystal', 12, 16, 4, (g, i) => {
    const c = '#7ff0ff';
    for (let y = 0; y < 7; y++) g.r(6 - y * 0.8, 1 + y, Math.round(y * 1.6) + 1, 1, c);
    for (let y = 0; y < 7; y++) g.r(1 + y * 0.8, 8 + y, Math.round((6 - y) * 1.6) + 1, 1, shade(c, -0.3));
    for (let y = 2; y < 8; y++) g.r(6, y, Math.round((y - 1) * 0.7), 1, '#3fb8d8');
    g.r(5, 2, 1, 12, '#d8fbff');
    const sy = 3 + i * 3;
    if (sy < 14) g.r(3, sy, 2, 1, '#ffffff');
  }, { outlineColor: NAVY });
  ensureAnim(scene, 'crystal', 'crystal', [0, 1, 2, 3], 6);

  // asteroids: 3 sizes x 2 shapes, dithered rock with craters and a rim light
  [[24, 'a2'], [16, 'a1'], [10, 'a0']].forEach(([s, k]) => {
    for (let v = 0; v < 2; v++) {
      const R = rng(s * 10 + v);
      const radii = Array.from({ length: 12 }, () => 0.72 + R() * 0.28);
      const craters = Array.from({ length: Math.max(1, Math.floor(s / 6)) }, () => [s * 0.25 + R() * s * 0.5, s * 0.25 + R() * s * 0.5, 1.2 + R() * s * 0.09]);
      const pal = [[204, 190, 172], [160, 146, 130], [122, 108, 104], [86, 74, 86], [58, 48, 68]];
      const inside = (x, y) => {
        const dx = x + 0.5 - s / 2, dy = y + 0.5 - s / 2;
        const a = (Math.atan2(dy, dx) / (Math.PI * 2) + 1) % 1;
        const i0 = Math.floor(a * 12), t = a * 12 - i0;
        const rr = (radii[i0] * (1 - t) + radii[(i0 + 1) % 12] * t) * (s / 2 - 1);
        return Math.hypot(dx, dy) <= rr;
      };
      pixTex(scene, `${k}_${v}`, s, s, (x, y) => {
        if (!inside(x, y)) return null;
        const dx = x + 0.5 - s / 2, dy = y + 0.5 - s / 2;
        let lit = (-dx - dy) / s + (noise3(x / 3, y / 3, v, s) - 0.5) * 0.5;
        for (const [cx, cy, cr] of craters) {
          const d = Math.hypot(x - cx, y - cy);
          if (d < cr) lit = (x - cx) + (y - cy) > 0 ? lit + 0.35 : lit - 0.55; // bowl: dark top-left, lit bottom-right
          else if (d < cr + 1 && (x - cx) + (y - cy) < 0) lit += 0.25;
        }
        let lv = Math.min(4, ditherLevel(clamp((0.45 - lit) * 3.2, 0, 4), x, y));
        if (!inside(x - 1, y - 1) && lv > 0) lv = 0; // rim light on the sunny edge
        return pal[lv];
      }, { outlineColor: NAVY });
    }
  });

  // suns: limb-darkened disc with boiling granulation and a flickering corona
  for (const [k, hex] of [['sun_harbor', '#ffb347'], ['sun_market', '#7fe0ff'], ['sun_herbal', '#ff8fb8']]) {
    const col = hexToRgb(hex);
    const pal = [WHITE, mix(col, WHITE, 0.65), mix(col, WHITE, 0.3), col, mix(col, [120, 30, 60], 0.3)];
    pixTex(scene, k, 96, 96, (x, y, f) => {
      const dx = x + 0.5 - 48, dy = y + 0.5 - 48;
      const d = Math.hypot(dx, dy) / 31;
      if (d <= 1) {
        const limb = Math.sqrt(1 - d * d);
        const gran = noise3(x / 3.2, y / 3.2, f * 0.8, 17);
        const v = limb * 0.85 + (gran - 0.5) * 0.35 - (dx + dy) / 260;
        return pal[Math.min(4, ditherLevel(clamp((1.02 - v) * 4.2, 0, 4), x, y))];
      }
      if (d > 1.5) return null;
      const a = Math.atan2(dy, dx);
      const ray = fbm(Math.cos(a) * 3 + 10, Math.sin(a) * 3 + 10, f * 0.6, 23);
      const strength = (1 - (d - 1) / 0.5) * (0.35 + ray * 1.1);
      const lv = Math.min(3, ditherLevel(strength * 3, x, y, 2));
      if (lv <= 0) return null;
      return [...mix(col, WHITE, lv === 3 ? 0.45 : 0.1), [0, 70, 130, 210][lv]];
    }, { frames: 4 });
    ensureAnim(scene, k, k, [0, 1, 2, 3], 4);
  }

  framesTex(scene, 'station', 112, 72, 2, (g, f) => {
    // solar wings with cell grid and a highlight row
    g.r(0, 30, 112, 12, '#22305a');
    for (let x = 2; x < 34; x += 8) for (let y = 31; y < 41; y += 5) { g.r(x, y, 7, 4, '#3f6ab8'); g.r(x, y, 7, 1, '#7fa8ef'); g.p(x + 5, y + 2, '#2a4a90'); }
    for (let x = 78; x < 110; x += 8) for (let y = 31; y < 41; y += 5) { g.r(x, y, 7, 4, '#3f6ab8'); g.r(x, y, 7, 1, '#7fa8ef'); g.p(x + 5, y + 2, '#2a4a90'); }
    g.r(34, 34, 44, 4, '#9aa0b8'); g.r(34, 34, 44, 1, '#c7cbe0'); g.r(34, 37, 44, 1, '#6a7090');
    // torus
    g.ellipse(56, 36, 30, 12, '#8a90ac'); g.ellipse(56, 35, 29, 11, '#c7cbe0'); g.ellipse(56, 34, 27, 9, '#dfe3ee');
    g.ellipse(56, 36, 25, 8, '#1a1a34');
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; g.r(56 + Math.cos(a) * 27.5, 35 + Math.sin(a) * 10, 2, 1, (i + f) % 3 ? '#ffd75e' : '#ffefb0'); }
    // hub dome
    g.circle(56, 36, 13, '#9aa0b8'); g.circle(55, 35, 12, '#dfe3ee'); g.circle(53, 33, 7, '#f4f6fb'); g.circle(51, 31, 2, '#ffffff');
    g.r(48, 38, 16, 3, '#3f8ad8'); g.r(48, 38, 16, 1, '#8fdcff');
    // antenna and dock
    g.r(55, 6, 2, 18, '#9aa0b8'); g.r(55, 6, 1, 18, '#c7cbe0'); g.circle(56, 6, 3, '#dfe3ee');
    g.r(55, 48, 2, 14, '#9aa0b8'); g.r(48, 60, 16, 4, '#c7cbe0'); g.r(48, 63, 16, 1, '#8a90ac');
    const on = f === 0;
    g.r(55, 2, 2, 2, on ? '#ff5a5a' : '#6a2a2a'); g.r(0, 29, 2, 2, on ? '#5aff8a' : '#2a6a3a'); g.r(110, 29, 2, 2, on ? '#2a6a3a' : '#5aff8a');
  }, { outlineColor: NAVY });
  ensureAnim(scene, 'station', 'station', [0, 1], 2);

  // warp gate: shaded metal ring around a spiralling vortex
  {
    const metal = [[216, 204, 255], [159, 124, 255], [106, 79, 176], [58, 42, 106]];
    const swirl = [[255, 255, 255], [201, 184, 255], [127, 224, 255], [127, 92, 255], [58, 30, 130], [22, 14, 60]];
    const N = 6;
    pixTex(scene, 'gate', 64, 64, (x, y, f) => {
      const dx = x + 0.5 - 32, dy = y + 0.5 - 32;
      const d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      if (d > 30.5) return null;
      if (d > 25.5) {
        const stud = Math.abs(((a / (Math.PI * 2)) * 8 + 8) % 1 - 0.5) < 0.09 && d > 26.5 && d < 29.5;
        if (stud) {
          const idx = Math.round(((a / (Math.PI * 2)) * 8 + 8)) % 8;
          return (idx + f) % 3 === 0 ? [255, 239, 160] : [255, 215, 94];
        }
        const lit = (-dx - dy) / d * 0.5 + (d > 28 ? 0.25 : -0.25);
        return metal[Math.min(3, ditherLevel(clamp((0.8 - lit) * 2.2, 0, 3), x, y))];
      }
      const s = Math.sin(a * 3 + d * 0.38 - (f / N) * Math.PI * 2);
      const v = (1 - d / 25.5) * 1.1 + s * 0.3;
      return swirl[Math.min(5, ditherLevel(clamp((1.05 - v) * 5, 0, 5), x, y))];
    }, { frames: N });
    ensureAnim(scene, 'gate', 'gate', Array.from({ length: N }, (_, i) => i), 10);
  }

  framesTex(scene, 'probe', 22, 16, 2, (g, f) => {
    g.r(0, 5, 6, 6, '#3f6ab8'); g.r(16, 5, 6, 6, '#3f6ab8'); g.r(0, 5, 6, 1, '#7fa8ef'); g.r(16, 5, 6, 1, '#7fa8ef'); g.r(2, 5, 1, 6, '#2a4a90'); g.r(19, 5, 1, 6, '#2a4a90');
    g.r(6, 7, 10, 2, '#9aa0b8');
    g.r(8, 4, 6, 8, '#c7cbe0'); g.r(8, 4, 6, 1, '#f4f6fb'); g.r(13, 4, 1, 8, '#8a90ac');
    g.r(10, 0, 2, 4, '#9aa0b8'); g.r(9, 0, 4, 1, '#dfe3ee');
    g.r(10, 6, 2, 2, f ? '#ff5a5a' : '#5aff8a');
  }, { outlineColor: NAVY });
  ensureAnim(scene, 'probe', 'probe', [0, 1], 2);

  // the space whale: shaded body, pale grooved belly and glowing star freckles
  framesTex(scene, 'whale', 72, 36, 2, (g, f) => {
    const ty = f ? 6 : 14;
    g.r(56, ty, 5, 10, '#2f5e98'); g.r(61, ty - 3, 7, 6, '#4f86c8'); g.r(61, ty + 8, 7, 5, '#3f6ea8'); g.r(62, ty - 3, 5, 1, '#7fb0e8');
    g.r(52, 13, 8, 9, '#2f5e98');
    g.ellipse(32, 18, 26, 11, '#28507f');
    g.ellipse(31, 17, 25, 10, '#3f6ea8');
    g.ellipse(29, 14, 20, 6, '#4f86c8');
    g.ellipse(26, 11, 12, 2, '#7fb0e8');
    g.ellipse(32, 23, 22, 6, '#9fd0ff');
    for (let i = 0; i < 6; i++) g.r(14 + i * 6, 22 + (i % 2), 4, 1, '#7fb0e0');
    g.ellipse(32, 26, 16, 2, '#7fb0e0');
    g.r(24, 26, 10, 4, '#244a78'); g.r(24, 26, 10, 1, '#3f6ea8');
    g.r(13, 14, 4, 3, '#ffffff'); g.r(14, 15, 2, 2, '#1a1240'); g.p(14, 15, '#ffffff');
    for (const [x, y] of [[22, 10], [30, 9], [38, 11], [44, 13], [34, 14], [26, 14]]) g.p(x, y, (x + f) % 3 ? '#d6f4ff' : '#ffffff');
    g.r(7, 20, 7, 1, '#1a2f58');
  }, { outlineColor: NAVY });
  ensureAnim(scene, 'whale', 'whale', [0, 1], 2);
}
