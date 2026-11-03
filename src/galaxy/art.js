import { makeTex, framesTex, outline, rng, shade, hexToRgb, ensureAnim } from '../art/canvas.js';

// ------------------------------------------------------------------ noise for planets
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

// A rotating pixel planet: `frames` frames of a lit sphere with a surface pattern.
export function genPlanet(scene, key, size, look, seed, frames = 16) {
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, size * frames, size);
  const ctx = tex.getContext();
  const img = ctx.createImageData(size * frames, size);
  const d = img.data;
  const [base, light, dark, accent] = look.c.map(hexToRgb);
  const ramp = (c) => [shade('#' + c.map((v) => v.toString(16).padStart(2, '0')).join(''), 0.18), null, shade('#' + c.map((v) => v.toString(16).padStart(2, '0')).join(''), -0.3), shade('#' + c.map((v) => v.toString(16).padStart(2, '0')).join(''), -0.58)].map((h, i) => (i === 1 ? c : hexToRgb(h)));
  const ramps = [ramp(base), ramp(light), ramp(dark), ramp(accent)];
  const r = size / 2 - 1;
  const L = [-0.55, -0.45, 0.7];
  for (let f = 0; f < frames; f++) {
    const phase = (f / frames) * Math.PI * 2;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = (x + 0.5 - size / 2) / r, ny = (y + 0.5 - size / 2) / r;
        const dd = nx * nx + ny * ny;
        if (dd > 1) continue;
        const nz = Math.sqrt(1 - dd);
        const lon = Math.atan2(nx, nz) + phase, lat = Math.asin(ny);
        const cx = Math.cos(lon) * Math.cos(lat), cy = Math.sin(lat), cz = Math.sin(lon) * Math.cos(lat);
        let tone = 0; // index into ramps
        const n = fbm(cx * 2.2 + 5, cy * 2.2 + 5, cz * 2.2 + 5, seed);
        switch (look.type) {
          case 'bands': {
            const b = Math.sin(lat * 9 + n * 3.5);
            tone = b > 0.55 ? 1 : b < -0.5 ? 2 : 0;
            if (n > 0.72) tone = 3;
            break;
          }
          case 'craters': {
            tone = n > 0.58 ? 1 : n < 0.38 ? 2 : 0;
            const c2 = noise3(cx * 6 + 1, cy * 6 + 1, cz * 6 + 1, seed + 3);
            if (c2 > 0.78) tone = 2;
            if (c2 > 0.86) tone = 3;
            break;
          }
          case 'ice':
            tone = n > 0.55 ? 1 : n < 0.36 ? 2 : 0;
            if (Math.abs(lat) > 1.05) tone = 3;
            break;
          case 'crystal': {
            const facet = Math.floor((lon * 3 + lat * 2 + n * 4) * 1.5) % 4;
            tone = [0, 1, 2, 0][(facet + 4) % 4];
            if (n > 0.7) tone = 3;
            break;
          }
          default: // terra: oceans (accent) + land (base/light/dark)
            tone = n < 0.47 ? 3 : n > 0.66 ? 2 : n > 0.58 ? 1 : 0;
            if (Math.abs(lat) > 1.15) tone = 1;
        }
        const lit = nx * L[0] + ny * L[1] + nz * L[2];
        const level = lit > 0.62 ? 0 : lit > 0.25 ? 1 : lit > -0.05 ? 2 : 3;
        let c = ramps[tone][level];
        if (dd > 0.86 && level < 3) c = c.map((v, i) => Math.round(v * 0.6 + light[i] * 0.4)); // atmosphere rim
        const o = (y * size * frames + f * size + x) * 4;
        d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  for (let f = 0; f < frames; f++) tex.add(String(f), 0, f * size, 0, size, size);
  tex.refresh();
  ensureAnim(scene, key, key, Array.from({ length: frames }, (_, i) => i), 5);
  return key;
}

// Planet rings, split into a back half and a front half so the planet sits between them.
export function genRing(scene, key, size, color) {
  const w = Math.round(size * 1.9), h = Math.round(size * 0.55);
  for (const half of ['back', 'front']) {
    makeTex(scene, `${key}_${half}`, w, h, (g) => {
      const cx = w / 2, cy = h / 2;
      for (let y = 0; y < h; y++) {
        if (half === 'back' ? y > cy : y <= cy) continue;
        for (let x = 0; x < w; x++) {
          const e = ((x - cx) / (w / 2)) ** 2 + ((y - cy) / (h / 2)) ** 2;
          if (e < 1 && e > 0.55) g.p(x, y, e > 0.8 ? color : shade(color, -0.25));
        }
      }
    });
  }
}

// ------------------------------------------------------------------ everything else in space
export function genSpaceArt(scene) {
  const starLayer = (key, n, sizes, seed) =>
    makeTex(scene, key, 512, 512, (g) => {
      const R = rng(seed);
      for (let i = 0; i < n; i++) {
        const x = Math.floor(R() * 512), y = Math.floor(R() * 512);
        const c = ['#ffffff', '#cfd8ff', '#ffe9c4', '#c9b8ff', '#9fd0ff'][Math.floor(R() * 5)];
        const s = sizes[Math.floor(R() * sizes.length)];
        if (s === 1) g.p(x, y, c);
        else { g.p(x, y, '#ffffff'); g.p(x - 1, y, c); g.p(x + 1, y, c); g.p(x, y - 1, c); g.p(x, y + 1, c); }
      }
    });
  starLayer('stars1', 700, [1], 1);
  starLayer('stars2', 160, [1, 1, 2], 2);
  starLayer('stars3', 40, [2], 3);

  for (const [key, col] of [['neb_harbor', '#9a78ff'], ['neb_market', '#4fd8d0'], ['neb_herbal', '#ff78b0']]) {
    makeTex(scene, key, 128, 128, (g) => {
      for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
        const d = Math.hypot(x - 64, y - 64) / 64;
        const n = noise3(x / 14, y / 14, 0, key.length);
        const a = (1 - d) * n;
        if (a > 0.12) { g.ctx.globalAlpha = Math.round(Math.min(0.7, a * 1.1) * 5) / 5; g.p(x, y, col); }
      }
      g.ctx.globalAlpha = 1;
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

  // the ship points right (rotation 0)
  makeTex(scene, 'ship', 26, 22, (g) => {
    for (let y = -5; y <= 5; y++) g.r(6, 11 + y, Math.round(15 - Math.abs(y) * 1.5), 1, '#dfe3ee');
    g.r(6, 9, 13, 1, '#ffffff');
    g.r(4, 2, 7, 3, '#c0453a'); g.r(6, 5, 3, 2, '#c0453a');
    g.r(4, 17, 7, 3, '#c0453a'); g.r(6, 15, 3, 2, '#c0453a');
    g.r(3, 8, 4, 7, '#5b5b6e'); g.r(2, 9, 2, 5, '#3b3b44');
    g.r(14, 9, 4, 4, '#5fc8ff'); g.r(14, 9, 2, 1, '#d6f4ff');
    g.r(8, 12, 7, 1, '#c0453a');
  }, { outlined: true });

  makeTex(scene, 'bolt', 10, 3, (g) => { g.r(0, 0, 10, 3, '#ffb347'); g.r(2, 1, 8, 1, '#fff6d0'); });
  makeTex(scene, 'spark', 3, 3, (g) => { g.r(0, 0, 3, 3, '#ffffff'); });
  makeTex(scene, 'dust', 5, 5, (g) => { g.r(1, 0, 3, 5, '#ffd75e'); g.r(0, 1, 5, 3, '#ffd75e'); g.p(2, 2, '#fffbe0'); }, { outlined: true });
  makeTex(scene, 'arrow', 9, 9, (g) => { for (let i = 0; i < 5; i++) g.r(i, 4 - i, 1, i * 2 + 1, '#ffd75e'); g.r(5, 3, 3, 3, '#ffd75e'); }, { outlined: true });
  makeTex(scene, 'promptE', 13, 14, (g) => {
    g.r(1, 0, 11, 11, '#fffaf0'); g.r(0, 1, 13, 9, '#fffaf0'); g.r(5, 11, 3, 1, '#fffaf0'); g.p(6, 12, '#fffaf0');
    g.r(4, 2, 1, 7, '#2a1c14'); g.r(4, 2, 5, 1, '#2a1c14'); g.r(4, 5, 4, 1, '#2a1c14'); g.r(4, 8, 5, 1, '#2a1c14');
  }, { outlined: true });

  framesTex(scene, 'crystal', 12, 16, 4, (g, i) => {
    const c = '#7ff0ff';
    for (let y = 0; y < 7; y++) g.r(6 - y * 0.8, 1 + y, Math.round(y * 1.6) + 1, 1, c);
    for (let y = 0; y < 7; y++) g.r(1 + y * 0.8, 8 + y, Math.round((6 - y) * 1.6) + 1, 1, shade(c, -0.25));
    g.r(5, 2, 1, 12, '#d8fbff');
    const sy = 3 + i * 3;
    if (sy < 14) g.r(3, sy, 2, 1, '#ffffff');
  });
  ensureAnim(scene, 'crystal', 'crystal', [0, 1, 2, 3], 6);

  // asteroids: 3 sizes x 2 shapes
  [[24, 'a2'], [16, 'a1'], [10, 'a0']].forEach(([s, k]) => {
    for (let v = 0; v < 2; v++) {
      makeTex(scene, `${k}_${v}`, s, s, (g) => {
        const R = rng(s * 10 + v);
        const radii = Array.from({ length: 10 }, () => 0.75 + R() * 0.25);
        for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
          const dx = x + 0.5 - s / 2, dy = y + 0.5 - s / 2;
          const a = (Math.atan2(dy, dx) / (Math.PI * 2) + 1) % 1;
          const rr = radii[Math.floor(a * 10)] * (s / 2 - 1);
          const dist = Math.hypot(dx, dy);
          if (dist > rr) continue;
          const lit = (-dx - dy) / s;
          g.p(x, y, lit > 0.2 ? '#a89a8c' : lit > -0.15 ? '#857668' : '#5e5249');
        }
        for (let i = 0; i < s / 5; i++) { const x = 3 + Math.floor(R() * (s - 6)), y = 3 + Math.floor(R() * (s - 6)); g.r(x, y, 2, 2, '#4e443c'); g.p(x, y, '#3e362f'); }
      }, { outlined: true });
    }
  });

  // suns (two frames of corona)
  for (const [k, col] of [['sun_harbor', '#ffb347'], ['sun_market', '#7fe0ff'], ['sun_herbal', '#ff8fb8']]) {
    framesTex(scene, k, 96, 96, 2, (g, f) => {
      const R = rng(f + 5);
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2 + f * 0.1;
        const len = 40 + R() * 6;
        g.line(48 + Math.cos(a) * 30, 48 + Math.sin(a) * 30, 48 + Math.cos(a) * len, 48 + Math.sin(a) * len, shade(col, 0.2));
      }
      g.circle(48, 48, 33, shade(col, -0.15));
      g.circle(48, 48, 30, col);
      g.circle(44, 44, 20, shade(col, 0.35));
      g.circle(40, 40, 9, shade(col, 0.7));
    }, { outlined: false });
    ensureAnim(scene, k, k, [0, 1], 3);
  }

  framesTex(scene, 'station', 112, 72, 2, (g, f) => {
    g.r(0, 30, 112, 12, '#2a3a6a');
    for (let x = 2; x < 34; x += 8) for (let y = 31; y < 41; y += 5) g.r(x, y, 7, 4, '#4f7fd0');
    for (let x = 78; x < 110; x += 8) for (let y = 31; y < 41; y += 5) g.r(x, y, 7, 4, '#4f7fd0');
    g.r(34, 34, 44, 4, '#9aa0b8');
    g.ellipse(56, 36, 30, 12, '#c7cbe0'); g.ellipse(56, 36, 25, 8, '#2a2a40');
    g.circle(56, 36, 13, '#dfe3ee'); g.circle(53, 33, 6, '#ffffff'); g.r(50, 36, 12, 3, '#5fc8ff');
    g.r(55, 6, 2, 18, '#9aa0b8'); g.circle(56, 6, 3, '#dfe3ee');
    g.r(55, 48, 2, 14, '#9aa0b8'); g.r(48, 60, 16, 4, '#c7cbe0');
    const on = f === 0;
    g.r(55, 2, 2, 2, on ? '#ff5a5a' : '#6a2a2a'); g.r(0, 29, 2, 2, on ? '#5aff8a' : '#2a6a3a'); g.r(110, 29, 2, 2, on ? '#2a6a3a' : '#5aff8a');
  });
  ensureAnim(scene, 'station', 'station', [0, 1], 2);

  framesTex(scene, 'gate', 64, 64, 4, (g, f) => {
    g.circle(32, 32, 30, '#5b3f8c'); g.circle(32, 32, 26, '#9f7cff'); g.circle(32, 32, 22, '#1a1240');
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + f * 0.26;
      const rr = 6 + (i % 3) * 5;
      g.r(32 + Math.cos(a) * rr, 32 + Math.sin(a) * rr, 2, 2, i % 2 ? '#ffd75e' : '#7fe0ff');
    }
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.r(31 + Math.cos(a) * 28, 31 + Math.sin(a) * 28, 3, 3, '#ffd75e'); }
  }, { outlined: false });
  ensureAnim(scene, 'gate', 'gate', [0, 1, 2, 3], 8);

  framesTex(scene, 'probe', 22, 16, 2, (g, f) => {
    g.r(0, 5, 6, 6, '#4f7fd0'); g.r(16, 5, 6, 6, '#4f7fd0'); g.r(6, 7, 10, 2, '#9aa0b8');
    g.r(8, 4, 6, 8, '#c7cbe0'); g.r(10, 0, 2, 4, '#9aa0b8'); g.r(9, 0, 4, 1, '#dfe3ee');
    g.r(10, 6, 2, 2, f ? '#ff5a5a' : '#5aff8a');
  });
  ensureAnim(scene, 'probe', 'probe', [0, 1], 2);

  framesTex(scene, 'whale', 72, 36, 2, (g, f) => {
    g.ellipse(32, 18, 26, 11, '#3f6ea8');
    g.ellipse(32, 23, 22, 6, '#9fd0ff');
    g.r(54, 13, 8, 8, '#3f6ea8');
    const ty = f ? 6 : 14;
    g.r(60, ty, 4, 10, '#3f6ea8'); g.r(63, ty - 3, 6, 6, '#4f86c8'); g.r(63, ty + 8, 6, 5, '#4f86c8');
    g.r(24, 26, 10, 4, '#2f5a8a');
    g.r(14, 14, 3, 3, '#ffffff'); g.p(15, 15, '#2a1c14');
    for (let i = 0; i < 5; i++) g.r(20 + i * 6, 10 + (i % 2), 2, 1, '#9fd0ff');
    g.r(8, 20, 6, 1, '#2a3f68');
  });
  ensureAnim(scene, 'whale', 'whale', [0, 1], 2);
}
