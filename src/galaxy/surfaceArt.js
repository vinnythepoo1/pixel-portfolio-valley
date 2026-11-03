import { makeTex, framesTex, rng, shade, ensureAnim } from '../art/canvas.js';

// Astronaut, side view facing right: 0 idle, 1-2 walk, 3 jump.
export function genAstronaut(scene) {
  framesTex(scene, 'astro', 16, 24, 4, (g, f) => {
    const suit = '#eef0f6', shadeC = '#b8bdd0', accent = '#ff8a3a';
    g.r(1, 9, 4, 8, '#9aa0b8'); g.r(1, 10, 4, 1, accent);
    g.r(4, 1, 10, 9, suit); g.r(5, 0, 8, 1, suit); g.r(3, 3, 1, 5, suit);
    g.r(8, 3, 6, 5, '#3f6ea8'); g.r(9, 3, 3, 1, '#9fd8ff'); g.r(13, 4, 1, 3, '#2a4a7a');
    g.r(4, 10, 9, 8, suit); g.r(4, 15, 9, 1, shadeC); g.r(6, 12, 3, 2, accent);
    const legs = [[[5, 18, 3, 4], [9, 18, 3, 4]], [[4, 18, 3, 4], [10, 18, 3, 3]], [[6, 18, 3, 3], [9, 18, 3, 4]], [[4, 17, 3, 3], [10, 18, 3, 3]]][f];
    for (const [x, y, w, h] of legs) { g.r(x, y, w, h, suit); g.r(x, y + h, w + 1, 2, '#6a7088'); }
    const arm = f === 1 ? [11, 11] : f === 2 ? [7, 11] : f === 3 ? [11, 9] : [9, 11];
    g.r(arm[0], arm[1], 3, 5, shadeC); g.r(arm[0], arm[1] + 5, 3, 1, '#6a7088');
  });
  ensureAnim(scene, 'astro-walk', 'astro', [1, 0, 2, 0], 9);
}

// Sky gradient, distant hills, ground and platform textures for one planet.
export function genSurface(scene, id, s) {
  makeTex(scene, `sky_${id}`, 4, 300, (g) => {
    const [a, b] = s.sky.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
    for (let y = 0; y < 300; y++) {
      const t = Math.min(1, y / 260);
      g.r(0, y, 4, 1, `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`);
    }
  });
  const hills = (key, w, h, color, amp, freq, seed, jag) =>
    makeTex(scene, key, w, h, (g) => {
      const R = rng(seed), p1 = R() * 9, p2 = R() * 9;
      for (let x = 0; x < w; x++) {
        const k = (x / w) * Math.PI * 2;
        let y = h * 0.45 + amp * (Math.sin(k * freq + p1) * 0.6 + Math.sin(k * freq * 3 + p2) * 0.3);
        if (jag) y += (x % 9 < 4 ? -1 : 1) * 2;
        y = Math.round(y);
        g.r(x, y, 1, h - y, color);
        g.r(x, y, 1, 1, shade(color, 0.15));
      }
    });
  hills(`far_${id}`, 512, 120, s.far, 26, 2, id.length * 3, true);
  hills(`mid_${id}`, 512, 90, s.mid, 16, 3, id.length * 5 + 1, false);

  makeTex(scene, `gnd_${id}`, 16, 64, (g) => {
    const R = rng(id.length);
    g.r(0, 0, 16, 64, s.ground);
    for (let i = 0; i < 30; i++) g.p(Math.floor(R() * 16), 6 + Math.floor(R() * 58), shade(s.ground, R() < 0.5 ? -0.15 : 0.1));
    g.r(0, 0, 16, 4, s.top); g.r(0, 4, 16, 1, shade(s.top, -0.3));
    g.p(3, 5, s.top); g.p(11, 5, s.top); g.p(7, 6, shade(s.top, -0.3));
  });
  makeTex(scene, `plat_${id}`, 48, 12, (g) => {
    g.r(0, 0, 48, 4, s.top); g.r(2, 4, 44, 4, s.ground); g.r(8, 8, 32, 2, s.ground); g.r(16, 10, 16, 2, s.ground);
    g.r(0, 4, 48, 1, shade(s.top, -0.3));
  }, { outlined: true });

  for (const p of s.props) genProp(scene, p, id, s);
}

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
  makeTex(scene, key, w, h, (g) => fn(g), { outlined: true });
  return key;
}

// Interactive structures shared by every planet.
export function genStructures(scene) {
  framesTex(scene, 'terminal', 22, 30, 2, (g, f) => {
    g.r(8, 18, 6, 12, '#5b5b6e'); g.r(4, 28, 14, 2, '#3b3b44');
    g.r(0, 0, 22, 18, '#3b3b54'); g.r(2, 2, 18, 14, f ? '#1a5a3a' : '#1a4a3a');
    for (let y = 4; y < 14; y += 3) g.r(4, y, 6 + ((y * 7 + f * 3) % 9), 1, '#7fffb0');
    g.r(18, 0, 2, 2, f ? '#5aff8a' : '#ffd75e');
  });
  ensureAnim(scene, 'terminal', 'terminal', [0, 1], 2);

  framesTex(scene, 'monolith', 26, 46, 2, (g, f) => {
    g.r(3, 4, 20, 42, '#2a2a40'); g.r(5, 2, 16, 2, '#2a2a40'); g.r(3, 4, 4, 42, '#3b3b54');
    const icons = ['#ffd75e', '#7fe0ff', '#ff8fb8', '#7cc062'];
    icons.forEach((c, i) => g.r(10, 10 + i * 8, 6, 5, f && i % 2 ? '#ffffff' : c));
  });
  ensureAnim(scene, 'monolith', 'monolith', [0, 1], 2);

  framesTex(scene, 'beacon', 30, 70, 3, (g, f) => {
    g.line(15, 8, 3, 69, '#9aa0b8'); g.line(15, 8, 27, 69, '#9aa0b8'); g.line(15, 8, 15, 69, '#c7cbe0');
    for (let y = 20; y < 68; y += 12) g.r(15 - (y - 8) / 5, y, ((y - 8) / 5) * 2, 1, '#9aa0b8');
    g.circle(15, 6, 5, '#2a2a40');
    g.circle(15, 6, 3, ['#ffd75e', '#ffffff', '#ffb347'][f]);
    g.r(0, 66, 30, 4, '#5b5b6e');
  });
  ensureAnim(scene, 'beacon', 'beacon', [0, 1, 2], 4);

  makeTex(scene, 'pad', 64, 8, (g) => {
    g.r(0, 2, 64, 6, '#5b5b6e'); g.r(0, 2, 64, 1, '#9aa0b8');
    for (let x = 4; x < 64; x += 10) g.r(x, 4, 5, 2, '#ffd75e');
  }, { outlined: true });

  makeTex(scene, 'landedship', 22, 30, (g) => {
    for (let y = 0; y < 22; y++) { const w = Math.min(11, Math.round(2 + y * 0.9)); g.r(11 - w / 2 - 2, y, w + 4, 1, '#dfe3ee'); }
    g.r(9, 6, 4, 4, '#5fc8ff');
    g.r(1, 16, 4, 12, '#c0453a'); g.r(17, 16, 4, 12, '#c0453a');
    g.r(7, 22, 8, 5, '#5b5b6e'); g.r(5, 27, 3, 3, '#3b3b44'); g.r(14, 27, 3, 3, '#3b3b44');
  }, { outlined: true });

  makeTex(scene, 'critter', 10, 8, (g) => {
    g.ellipse(5, 5, 4, 3, '#ffffff'); g.p(3, 4, '#2a1c14'); g.p(6, 4, '#2a1c14'); g.r(2, 7, 2, 1, '#ffffff'); g.r(6, 7, 2, 1, '#ffffff');
  }, { outlined: true });

  makeTex(scene, 'puff', 8, 8, (g) => { g.circle(4, 4, 3, '#ffffff'); });
  makeTex(scene, 'dot', 2, 2, (g) => { g.r(0, 0, 2, 2, '#ffffff'); });
  makeTex(scene, 'streak', 10, 1, (g) => { g.r(0, 0, 10, 1, '#ffffff'); });
}
