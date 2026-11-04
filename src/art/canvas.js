// Small toolkit for drawing pixel art into Phaser canvas textures.

export const OUTLINE = '#2a1c14';

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// amt < 0 darkens, amt > 0 lightens. Works on 6-digit hex colours.
export function shade(hex, amt) {
  const f = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return '#' + hexToRgb(hex).map((v) => f(v).toString(16).padStart(2, '0')).join('');
}

// A painter draws rectangles at an offset; mirrorW flips it horizontally inside a frame of that width.
export function painter(ctx, ox = 0, oy = 0, mirrorW = 0) {
  const r = (x, y, w, h, c) => {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    if (!c || w <= 0 || h <= 0) return;
    ctx.fillStyle = c;
    const X = mirrorW ? ox + mirrorW - x - w : ox + x;
    ctx.fillRect(X, oy + y, w, h);
  };
  return {
    ctx,
    r,
    p: (x, y, c) => r(x, y, 1, 1, c),
    circle(cx, cy, rad, c) {
      for (let y = -rad; y <= rad; y++) {
        const w = Math.round(Math.sqrt(Math.max(0, rad * rad + rad * 0.6 - y * y)));
        r(cx - w, cy + y, w * 2 + 1, 1, c);
      }
    },
    ellipse(cx, cy, rx, ry, c) {
      for (let y = -ry; y <= ry; y++) {
        const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.5))));
        r(cx - w, cy + y, w * 2 + 1, 1, c);
      }
    },
    line(x0, y0, x1, y1, c) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let i = 0; i <= n; i++) r(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 1, 1, c);
    },
  };
}

// Adds a 1px dark outline around every opaque shape in the region.
export function outline(ctx, x0, y0, w, h, color = OUTLINE) {
  const img = ctx.getImageData(x0, y0, w, h);
  const d = img.data;
  const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 180;
  const mark = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] !== 0) continue;
      if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) mark.push(y * w + x);
    }
  }
  const [r, g, b] = hexToRgb(color);
  for (const i of mark) {
    d[i * 4] = r;
    d[i * 4 + 1] = g;
    d[i * 4 + 2] = b;
    d[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, x0, y0);
}

// Creates a canvas texture once and draws into it.
export function makeTex(scene, key, w, h, draw, { outlined = false, outlineColor = OUTLINE, bevelled = false } = {}) {
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  draw(painter(ctx), ctx);
  if (bevelled) bevel(ctx, w, h);
  if (outlined) outline(ctx, 0, 0, w, h, outlineColor);
  tex.refresh();
  return key;
}

// Creates a horizontal strip of n frames named '0', '1', ...
export function framesTex(scene, key, fw, fh, n, drawFrame, { outlined = true, outlineColor = OUTLINE, bevelled = false } = {}) {
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, fw * n, fh);
  const ctx = tex.getContext();
  for (let i = 0; i < n; i++) drawFrame(painter(ctx, i * fw, 0), i);
  if (bevelled) bevel(ctx, fw * n, fh, fw);
  if (outlined) outline(ctx, 0, 0, fw * n, fh, outlineColor);
  for (let i = 0; i < n; i++) tex.add(String(i), 0, i * fw, 0, fw, fh);
  tex.refresh();
  return key;
}

export function ensureAnim(scene, key, tex, frames, frameRate, repeat = -1) {
  if (scene.anims.exists(key)) return key;
  scene.anims.create({ key, frames: frames.map((f) => ({ key: tex, frame: String(f) })), frameRate, repeat });
  return key;
}

// 4x4 ordered-dither threshold (0..1) for smooth pixel-art shading.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

// Blend two [r,g,b] colours.
export const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

// Picks a band index from a continuous level, dithering only near band edges (crisp bands, soft seams).
export function ditherLevel(level, x, y, sharp = 2.5) {
  const base = Math.floor(level), frac = level - base;
  const t = Math.max(0, Math.min(1, (frac - 0.5) * sharp + 0.5));
  return base + (t > bayer(x, y) ? 1 : 0);
}

// Gives flat shapes volume: edges facing the top-left light get a highlight, edges facing
// bottom-right get a shadow. `fw` keeps frames in a strip from bleeding into each other.
export function bevel(ctx, w, h, fw = w, ignore = null) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const src = new Uint8ClampedArray(d);
  const ig = ignore && hexToRgb(ignore);
  const isIgnored = (o) => ig && src[o] === ig[0] && src[o + 1] === ig[1] && src[o + 2] === ig[2];
  const solid = (x, y, fx) => x >= fx && y >= 0 && x < fx + fw && x < w && y < h && src[(y * w + x) * 4 + 3] > 180 && !isIgnored((y * w + x) * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = (y * w + x) * 4;
    if (src[o + 3] <= 180 || isIgnored(o)) continue;
    const fx = Math.floor(x / fw) * fw;
    const lit = !solid(x, y - 1, fx) || !solid(x - 1, y, fx);
    const dark = !solid(x, y + 1, fx) || !solid(x + 1, y, fx);
    const lum = (src[o] * 3 + src[o + 1] * 6 + src[o + 2]) / 10;
    if (lit && !dark) for (let i = 0; i < 3; i++) d[o + i] = src[o + i] + (255 - src[o + i]) * 0.28;
    else if (dark && !lit) for (let i = 0; i < 3; i++) d[o + i] = src[o + i] * (lum > 200 ? 0.8 : 0.7) + [12, 8, 40][i] * 0.12;
  }
  ctx.putImageData(img, 0, 0);
}
