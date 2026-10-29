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
export function makeTex(scene, key, w, h, draw, { outlined = false } = {}) {
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  draw(painter(ctx), ctx);
  if (outlined) outline(ctx, 0, 0, w, h);
  tex.refresh();
  return key;
}

// Creates a horizontal strip of n frames named '0', '1', ...
export function framesTex(scene, key, fw, fh, n, drawFrame, { outlined = true } = {}) {
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, fw * n, fh);
  const ctx = tex.getContext();
  for (let i = 0; i < n; i++) drawFrame(painter(ctx, i * fw, 0), i);
  if (outlined) outline(ctx, 0, 0, fw * n, fh);
  for (let i = 0; i < n; i++) tex.add(String(i), 0, i * fw, 0, fw, fh);
  tex.refresh();
  return key;
}

export function ensureAnim(scene, key, tex, frames, frameRate, repeat = -1) {
  if (scene.anims.exists(key)) return key;
  scene.anims.create({ key, frames: frames.map((f) => ({ key: tex, frame: String(f) })), frameRate, repeat });
  return key;
}
