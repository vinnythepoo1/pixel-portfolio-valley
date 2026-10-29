import { makeTex, framesTex, painter, outline, rng, shade, ensureAnim } from './canvas.js';

// ---------------------------------------------------------------- tiles
export const T = { GRASS: 0, GRASS2: 1, FLOWERS: 2, PATH: 3, STONE: 4, WATER_A: 5, WATER_B: 6, SAND: 7, DOCK: 8, FIELD: 9 };

export function genTiles(scene) {
  makeTex(scene, 'tiles', 16 * 10, 16, (g) => {
    const R = rng(11);
    const speck = (ox, cols, n) => {
      for (let i = 0; i < n; i++) g.p(ox + Math.floor(R() * 16), Math.floor(R() * 16), cols[Math.floor(R() * cols.length)]);
    };
    const tuft = (x, y, c) => { g.p(x, y, c); g.p(x + 2, y, c); g.p(x + 1, y + 1, c); };
    const flower = (x, y, petal) => {
      g.p(x, y, '#ffe27a');
      g.p(x - 1, y, petal); g.p(x + 1, y, petal); g.p(x, y - 1, petal); g.p(x, y + 1, petal);
    };

    // grass, grass with tufts, grass with flowers
    for (let i = 0; i < 3; i++) {
      const ox = i * 16;
      g.r(ox, 0, 16, 16, '#6dab4c');
      speck(ox, ['#64a045', '#78b656', '#5f9a41'], 30);
      tuft(ox + 3, 4, '#56913b');
      tuft(ox + 10, 11, '#56913b');
      if (i === 1) { tuft(ox + 7, 1, '#88c766'); tuft(ox + 1, 12, '#88c766'); tuft(ox + 12, 5, '#56913b'); }
      if (i === 2) { flower(ox + 4, 5, '#fff6e6'); flower(ox + 11, 9, '#f6a5c0'); flower(ox + 6, 13, '#b9a6f2'); }
    }
    // path
    g.r(48, 0, 16, 16, '#c9a46c');
    speck(48, ['#b89259', '#d8b882', '#bf9a62'], 40);
    g.r(51, 4, 2, 1, '#a8834f'); g.r(58, 10, 2, 1, '#a8834f'); g.r(54, 13, 1, 1, '#a8834f');
    // plaza stone
    g.r(64, 0, 16, 16, '#bcb3a2');
    speck(64, ['#b1a897', '#c6bead'], 16);
    g.r(64, 7, 16, 1, '#9f9585'); g.r(64, 15, 16, 1, '#9f9585');
    g.r(71, 0, 1, 7, '#9f9585'); g.r(79, 0, 1, 7, '#9f9585');
    g.r(67, 8, 1, 7, '#9f9585'); g.r(75, 8, 1, 7, '#9f9585');
    g.r(64, 0, 7, 1, '#cfc7b8'); g.r(72, 0, 7, 1, '#cfc7b8'); g.r(68, 8, 7, 1, '#cfc7b8');
    // water A / B
    for (const [ox, waves] of [[80, [[2, 3, 4], [9, 8, 5], [3, 12, 3]]], [96, [[5, 4, 4], [1, 9, 4], [10, 13, 4]]]]) {
      g.r(ox, 0, 16, 16, '#3d84c2');
      speck(ox, ['#3779b4', '#468fcc'], 18);
      for (const [x, y, w] of waves) g.r(ox + x, y, w, 1, '#78bce8');
      g.p(ox + waves[0][0] + 1, waves[0][1] - 1, '#d6f0ff');
    }
    // sand
    g.r(112, 0, 16, 16, '#e9d49c');
    speck(112, ['#dcc287', '#f3e2b2', '#d4b97c'], 34);
    // dock planks
    g.r(128, 0, 16, 16, '#a87442');
    for (const y of [3, 7, 11, 15]) g.r(128, y, 16, 1, '#7d5430');
    for (const y of [0, 4, 8, 12]) g.r(128, y, 16, 1, '#bd8a55');
    g.r(133, 0, 1, 3, '#7d5430'); g.r(140, 4, 1, 3, '#7d5430'); g.r(131, 8, 1, 3, '#7d5430'); g.r(138, 12, 1, 3, '#7d5430');
    g.p(130, 1, '#5b3a22'); g.p(142, 9, '#5b3a22');
    // tilled field
    g.r(144, 0, 16, 16, '#8b5a36');
    for (const y of [1, 5, 9, 13]) g.r(144, y, 16, 2, '#74482a');
    speck(144, ['#9d6a43'], 12);
  });
}

// ---------------------------------------------------------------- characters
const DIRS = ['down', 'left', 'right', 'up'];

export function genChar(scene, key, look) {
  if (scene.textures.exists(key)) return key;
  const L = { skin: '#f1c7a1', hair: '#5a3a22', shirt: '#3f7fbf', pants: '#3b3b5c', shoes: '#4a3020', eye: '#2a1c14', ...look };
  L.shirtDark = L.shirtDark || shade(L.shirt, -0.2);
  L.belt = L.belt || shade(L.pants, -0.25);
  const tex = scene.textures.createCanvas(key, 16 * 12, 24);
  const ctx = tex.getContext();
  DIRS.forEach((dir, di) => {
    for (let f = 0; f < 3; f++) {
      const g = painter(ctx, (di * 3 + f) * 16, 0, dir === 'right' ? 16 : 0);
      drawCharFrame(g, dir === 'right' ? 'left' : dir, f, L);
    }
  });
  outline(ctx, 0, 0, 16 * 12, 24);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  for (let i = 0; i < 12; i++) ctx.fillRect(i * 16 + 4, 23, 8, 1);
  DIRS.forEach((dir, di) => {
    for (let f = 0; f < 3; f++) tex.add(`${dir}${f}`, 0, (di * 3 + f) * 16, 0, 16, 24);
  });
  tex.refresh();
  return key;
}

export function ensureCharAnims(scene, key) {
  for (const dir of DIRS) {
    const k = `${key}-${dir}`;
    if (!scene.anims.exists(k)) {
      scene.anims.create({ key: k, frames: [1, 0, 2, 0].map((f) => ({ key, frame: `${dir}${f}` })), frameRate: 8, repeat: -1 });
    }
  }
}

function drawCharFrame(g, dir, f, L) {
  const { r, p } = g;
  const side = dir === 'left';
  // legs
  if (side) {
    if (f === 0) { r(6, 19, 2, 3, L.pants); r(8, 19, 2, 3, L.pants); r(5, 22, 3, 1, L.shoes); r(8, 22, 2, 1, L.shoes); }
    else if (f === 1) { r(4, 19, 3, 3, L.pants); r(9, 19, 2, 3, L.pants); r(3, 22, 3, 1, L.shoes); r(9, 22, 2, 1, L.shoes); }
    else { r(6, 19, 2, 2, L.pants); r(8, 19, 2, 3, L.pants); r(5, 21, 3, 1, L.shoes); r(8, 22, 3, 1, L.shoes); }
  } else {
    const lUp = f === 1, rUp = f === 2;
    r(5, 19, 2, lUp ? 2 : 3, L.pants); r(5, lUp ? 21 : 22, 2, 1, L.shoes);
    r(9, 19, 2, rUp ? 2 : 3, L.pants); r(9, rUp ? 21 : 22, 2, 1, L.shoes);
  }
  // body
  if (side) {
    r(5, 13, 6, 6, L.shirt); r(5, 17, 6, 1, L.belt);
    if (L.apron) r(5, 14, 3, 5, L.apron);
    if (L.dress) { r(5, 16, 7, 5, L.dress); r(5, 20, 7, 1, shade(L.dress, -0.2)); }
    const ax = f === 1 ? 5 : f === 2 ? 8 : 7;
    r(ax, 13, 2, 5, L.shirtDark); r(ax, 18, 2, 1, L.skin);
  } else {
    r(4, 13, 8, 6, L.shirt); r(4, 17, 8, 1, L.belt);
    if (dir === 'down') r(6, 13, 4, 1, shade(L.shirt, 0.18));
    if (L.apron && dir === 'down') r(5, 14, 6, 5, L.apron);
    if (L.dress) { r(4, 16, 8, 5, L.dress); r(4, 20, 8, 1, shade(L.dress, -0.2)); }
    if (L.cape && dir === 'up') r(4, 13, 8, 7, L.cape);
    const la = f === 1 ? -1 : 0, ra = f === 2 ? -1 : 0;
    r(3, 13, 1, 5 + la, L.shirtDark); r(3, 18 + la, 1, 1, L.skin);
    r(12, 13, 1, 5 + ra, L.shirtDark); r(12, 18 + ra, 1, 1, L.skin);
  }
  // head
  const H = L.hair, K = L.skin;
  r(4, 6, 8, 7, K);
  r(5, 5, 6, 1, H); r(4, 6, 8, 1, H);
  if (dir === 'down') {
    r(3, 6, 1, 4, H); r(12, 6, 1, 4, H); r(4, 7, 2, 1, H); r(10, 7, 2, 1, H);
    p(6, 9, L.eye); p(9, 9, L.eye);
    p(5, 10, '#eb9c8c'); p(10, 10, '#eb9c8c');
    r(7, 11, 2, 1, '#c0705a');
    if (L.long) { r(3, 10, 1, 4, H); r(12, 10, 1, 4, H); }
    if (L.beard) r(5, 10, 6, 3, L.beard);
  } else if (dir === 'up') {
    r(3, 6, 1, 5, H); r(12, 6, 1, 5, H); r(4, 7, 8, 5, H);
    if (L.long) r(4, 12, 8, 2, H);
  } else {
    r(8, 7, 4, 4, H); r(12, 6, 1, 4, H); p(4, 7, H);
    p(5, 9, L.eye); p(3, 10, K); p(6, 10, '#eb9c8c');
    if (L.long) r(9, 11, 3, 3, H);
    if (L.beard) r(4, 10, 4, 3, L.beard);
  }
  if (L.glasses && dir !== 'up') {
    if (side) { r(4, 9, 3, 1, '#2a1c14'); } else { r(5, 9, 2, 1, '#2a1c14'); r(9, 9, 2, 1, '#2a1c14'); r(7, 9, 2, 1, '#2a1c14'); }
  }
  // hats
  if (L.hat) {
    const Hh = L.hat, Hd = shade(L.hat, -0.25);
    switch (L.hatStyle) {
      case 'wizard':
        r(7, 0, 2, 1, Hh); r(7, 1, 3, 1, Hh); r(6, 2, 4, 1, Hh); r(6, 3, 5, 1, Hh); r(5, 4, 6, 1, Hh); r(2, 5, 12, 1, Hd);
        p(8, 2, '#ffd75e');
        break;
      case 'cap':
        r(4, 4, 8, 2, Hh);
        if (dir === 'down') r(4, 6, 8, 1, Hd); else if (side) r(2, 6, 6, 1, Hd);
        break;
      case 'straw':
        r(5, 3, 6, 2, Hh); r(2, 5, 12, 1, Hd); r(5, 4, 6, 1, '#c0503a');
        break;
      case 'hood':
        r(4, 4, 8, 2, Hh); r(3, 5, 1, 8, Hh); r(12, 5, 1, 8, Hh);
        if (dir === 'up') r(4, 6, 8, 7, Hh);
        if (side) r(8, 6, 4, 7, Hh);
        break;
      case 'bandana':
        r(4, 5, 8, 2, Hh);
        if (dir !== 'down') r(11, 7, 2, 2, Hd);
        break;
      case 'tricorn':
        r(3, 4, 10, 2, Hh); r(5, 3, 6, 1, Hh); p(8, 4, '#ffd75e');
        break;
      case 'flower':
        p(10, 5, '#ffe27a'); p(9, 5, Hh); p(11, 5, Hh); p(10, 4, Hh); p(10, 6, Hh);
        break;
      default:
        break;
    }
  }
}

// ---------------------------------------------------------------- small icons used on shop signs
export function drawIcon(g, x, y, name) {
  const { r, p } = g;
  switch (name) {
    case 'potion':
      r(x + 3, y, 1, 2, '#c8b48a'); r(x + 2, y + 2, 3, 1, '#bfe3f7'); r(x + 1, y + 3, 5, 4, '#d04a6a'); p(x + 2, y + 4, '#ffb3c4');
      break;
    case 'crate':
      r(x, y + 1, 7, 6, '#b07a44'); r(x, y + 1, 7, 1, '#7a5432'); r(x, y + 6, 7, 1, '#7a5432');
      p(x + 1, y + 2, '#7a5432'); p(x + 2, y + 3, '#7a5432'); p(x + 3, y + 4, '#7a5432'); p(x + 4, y + 5, '#7a5432');
      break;
    case 'letter':
      r(x, y + 1, 7, 5, '#f3ead2');
      p(x + 1, y + 2, '#7a5432'); p(x + 2, y + 3, '#7a5432'); p(x + 4, y + 3, '#7a5432'); p(x + 5, y + 2, '#7a5432');
      p(x + 3, y + 4, '#c0392b');
      break;
    case 'coin':
      r(x + 2, y, 3, 7, '#e2b23a'); r(x, y + 2, 7, 3, '#e2b23a'); r(x + 1, y + 1, 5, 5, '#e2b23a');
      r(x + 3, y + 2, 1, 3, '#a87a1e');
      break;
    case 'sword':
      r(x + 3, y, 1, 5, '#d9dde3'); r(x + 1, y + 4, 5, 1, '#8a6a3a'); r(x + 3, y + 5, 1, 2, '#6b4a2f');
      break;
    case 'bed':
      r(x, y + 3, 7, 3, '#c94f4f'); r(x, y + 2, 2, 2, '#f1e6c8'); r(x, y + 6, 1, 1, '#6b4a2f'); r(x + 6, y + 6, 1, 1, '#6b4a2f');
      break;
    case 'horseshoe':
      r(x + 1, y + 1, 1, 5, '#9aa0a8'); r(x + 5, y + 1, 1, 5, '#9aa0a8'); r(x + 2, y + 5, 3, 1, '#9aa0a8');
      break;
    case 'book':
      r(x + 1, y + 1, 5, 6, '#5b3f8c'); r(x + 2, y + 2, 3, 1, '#ffd75e'); r(x + 5, y + 1, 1, 6, '#f3ead2');
      break;
    case 'leaf':
      r(x + 2, y + 1, 3, 1, '#5fae4c'); r(x + 1, y + 2, 5, 2, '#5fae4c'); r(x + 2, y + 4, 3, 1, '#5fae4c'); p(x + 3, y + 5, '#3f7a3a');
      g.line(x + 1, y + 4, x + 5, y + 1, '#3f7a3a');
      break;
    case 'mortar':
      r(x + 1, y + 4, 5, 3, '#9a9a9a'); r(x, y + 4, 7, 1, '#b5b5b5'); r(x + 4, y, 1, 4, '#7a5432');
      break;
    default:
      break;
  }
}

// ---------------------------------------------------------------- town decor
export function genDecor(scene) {
  const tree = (key, canopy, extra) =>
    makeTex(scene, key, 32, 40, (g, ctx) => {
      g.r(14, 28, 5, 10, '#6b4a2f'); g.r(17, 28, 2, 10, '#563a24');
      g.r(12, 37, 2, 1, '#6b4a2f'); g.r(19, 37, 2, 1, '#563a24');
      g.circle(16, 17, 13, canopy[0]);
      g.circle(15, 15, 11, canopy[1]);
      g.circle(12, 11, 6, canopy[2]);
      g.circle(10, 9, 2, canopy[3]);
      const R = rng(key.length * 31);
      for (let i = 0; i < 14; i++) g.p(5 + Math.floor(R() * 22), 6 + Math.floor(R() * 20), canopy[0]);
      if (extra) for (let i = 0; i < 8; i++) g.r(6 + Math.floor(R() * 20), 7 + Math.floor(R() * 18), 2, 2, extra);
      outline(ctx, 0, 0, 32, 40);
      g.ellipse(16, 38, 9, 1, 'rgba(0,0,0,0.22)');
    });
  tree('tree0', ['#3f7a3a', '#4f9142', '#64a852', '#7cc062']);
  tree('tree1', ['#a8506e', '#c96d8a', '#e08aa5', '#f6c2d2']);
  tree('tree2', ['#3f7a3a', '#4f9142', '#64a852', '#7cc062'], '#d8453a');
  makeTex(scene, 'tree3', 32, 40, (g, ctx) => {
    g.r(14, 30, 4, 8, '#6b4a2f');
    for (let i = 0; i < 3; i++) {
      const top = 2 + i * 8, h = 14;
      for (let y = 0; y < h; y++) {
        const w = Math.round(3 + y * (0.75 + i * 0.12));
        g.r(16 - w, top + y, w * 2, 1, y < 3 ? '#4f9142' : '#356b3c');
        g.r(16 - w, top + y, Math.max(1, Math.floor(w / 2)), 1, '#4a8a44');
      }
    }
    outline(ctx, 0, 0, 32, 40);
    g.ellipse(16, 38, 8, 1, 'rgba(0,0,0,0.22)');
  });

  makeTex(scene, 'bush', 18, 14, (g) => {
    g.circle(9, 8, 6, '#3f7a3a'); g.circle(8, 7, 5, '#4f9142'); g.circle(6, 5, 2, '#64a852');
    g.p(11, 6, '#e05555'); g.p(5, 9, '#e05555'); g.p(12, 10, '#e05555');
  }, { outlined: true });

  makeTex(scene, 'lamp', 10, 30, (g) => {
    g.r(4, 9, 2, 19, '#3b3b44'); g.r(3, 27, 4, 2, '#3b3b44');
    g.r(1, 1, 8, 1, '#3b3b44'); g.r(2, 2, 6, 7, '#3b3b44'); g.r(3, 3, 4, 5, '#ffe08a'); g.p(3, 3, '#fff6d0');
  }, { outlined: true });

  makeTex(scene, 'glow', 64, 64, (g, ctx) => {
    const grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,214,130,0.95)');
    grd.addColorStop(0.4, 'rgba(255,190,90,0.4)');
    grd.addColorStop(1, 'rgba(255,170,60,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 64, 64);
  });

  makeTex(scene, 'sign', 16, 20, (g) => {
    g.r(7, 9, 2, 11, '#6b4a2f');
    g.r(1, 2, 14, 8, '#b98a52'); g.r(1, 2, 14, 1, '#d1a46c'); g.r(1, 9, 14, 1, '#7a5432');
    g.r(3, 4, 10, 1, '#7a5432'); g.r(3, 6, 7, 1, '#7a5432');
  }, { outlined: true });

  makeTex(scene, 'board', 32, 30, (g) => {
    g.r(3, 12, 3, 18, '#6b4a2f'); g.r(26, 12, 3, 18, '#6b4a2f');
    g.r(1, 3, 30, 18, '#9c6b3c'); g.r(2, 4, 28, 16, '#b5824c');
    g.r(0, 0, 32, 4, '#7a4b2a'); g.r(0, 0, 32, 1, '#9c6b3c');
    g.r(4, 6, 7, 9, '#f1e6c8'); g.r(13, 5, 6, 10, '#efe0b0'); g.r(21, 7, 7, 8, '#f5ead2');
    for (const [x, y] of [[5, 8], [5, 10], [14, 7], [14, 9], [14, 11], [22, 9], [22, 11]]) g.r(x, y, 4, 1, '#a89878');
    g.p(7, 6, '#d04a3a'); g.p(16, 5, '#3f6ea8'); g.p(24, 7, '#d04a3a');
  }, { outlined: true });

  makeTex(scene, 'mailbox', 12, 20, (g) => {
    g.r(5, 10, 2, 10, '#6b4a2f');
    g.r(2, 2, 8, 1, '#4f7fc0'); g.r(1, 3, 10, 8, '#3f6ea8'); g.r(3, 6, 6, 1, '#24446e');
    g.r(10, 3, 1, 5, '#d04a3a'); g.r(10, 3, 2, 2, '#d04a3a');
  }, { outlined: true });

  framesTex(scene, 'fountain', 64, 46, 2, (g, i) => {
    g.ellipse(32, 32, 30, 9, '#a49b8c');
    g.r(2, 32, 61, 8, '#8b8274');
    g.ellipse(32, 40, 30, 4, '#8b8274');
    for (const x of [10, 22, 34, 46, 56]) g.r(x, 34, 1, 6, '#776f62');
    g.ellipse(32, 31, 30, 9, '#b3aa9b');
    g.ellipse(32, 31, 26, 6, '#4a92cf');
    if (i === 0) { g.r(13, 30, 6, 1, '#8ccbf0'); g.r(42, 33, 5, 1, '#8ccbf0'); g.r(22, 35, 4, 1, '#8ccbf0'); }
    else { g.r(16, 32, 6, 1, '#8ccbf0'); g.r(39, 30, 5, 1, '#8ccbf0'); g.r(25, 34, 4, 1, '#8ccbf0'); }
    g.r(29, 14, 6, 17, '#b3aa9b'); g.r(29, 14, 2, 17, '#c7bfb0');
    g.ellipse(32, 14, 10, 3, '#a49b8c'); g.ellipse(32, 13, 8, 2, '#6fb4e2');
    g.r(31, 3, 2, 10, '#cfeaf9');
    const drops = i === 0 ? [[27, 5], [36, 5], [25, 8], [38, 8], [23, 12], [40, 12]] : [[28, 4], [35, 4], [24, 7], [39, 7], [22, 11], [41, 11]];
    for (const [x, y] of drops) g.r(x, y, 1, 2, '#cfeaf9');
    for (const x of [22, 42]) for (let y = 17 + i; y < 29; y += 3) g.r(x, y, 1, 2, '#9fd4f2');
  });

  makeTex(scene, 'bench', 26, 14, (g) => {
    g.r(1, 0, 24, 3, '#a87442'); g.r(1, 5, 24, 3, '#a87442'); g.r(1, 0, 24, 1, '#c08a55');
    g.r(3, 3, 2, 11, '#3b3b44'); g.r(21, 3, 2, 11, '#3b3b44');
  }, { outlined: true });

  makeTex(scene, 'well', 30, 34, (g) => {
    g.r(5, 8, 2, 16, '#6b4a2f'); g.r(23, 8, 2, 16, '#6b4a2f');
    for (let y = 0; y < 8; y++) g.r(14 - y * 2, y + 1, 2 + y * 4, 1, y % 2 ? '#8a3b30' : '#a0413a');
    g.r(6, 13, 18, 1, '#5b3a22'); g.r(14, 14, 1, 6, '#c8b48a'); g.r(12, 19, 5, 4, '#8a5a32');
    g.ellipse(15, 25, 12, 3, '#a49b8c'); g.r(3, 25, 25, 7, '#8b8274'); g.ellipse(15, 32, 12, 1, '#8b8274');
    g.ellipse(15, 25, 9, 2, '#26425e');
    for (const x of [7, 13, 19, 25]) g.r(x, 27, 1, 4, '#776f62');
  }, { outlined: true });

  makeTex(scene, 'bell', 18, 32, (g) => {
    g.r(1, 4, 2, 28, '#6b4a2f'); g.r(15, 4, 2, 28, '#6b4a2f'); g.r(0, 2, 18, 3, '#7a4b2a'); g.r(0, 1, 18, 1, '#9c6b3c');
    g.r(7, 6, 4, 1, '#d9a536'); g.r(6, 7, 6, 5, '#d9a536'); g.r(5, 12, 8, 2, '#d9a536'); g.r(7, 7, 1, 5, '#f2cf6a');
    g.r(8, 14, 2, 2, '#8a6a1e'); g.r(8, 5, 2, 1, '#3b3b44');
  }, { outlined: true });

  for (const [key, col] of [['flag_blue', '#3f5fa8'], ['flag_red', '#c0453a']]) {
    framesTex(scene, key, 14, 30, 2, (g, i) => {
      g.r(1, 0, 2, 30, '#5b4a3a'); g.p(1, 0, '#ffd75e');
      if (i === 0) { g.r(3, 2, 9, 7, col); g.r(11, 3, 1, 5, shade(col, -0.25)); g.r(6, 4, 2, 2, '#ffd75e'); }
      else { g.r(3, 3, 9, 7, col); g.r(3, 2, 4, 1, col); g.r(10, 4, 2, 6, shade(col, -0.25)); g.r(6, 5, 2, 2, '#ffd75e'); }
    });
  }

  makeTex(scene, 'crate', 14, 14, (g) => {
    g.r(0, 0, 14, 14, '#b07a44'); g.r(0, 0, 14, 2, '#c99158'); g.r(0, 12, 14, 2, '#7a5432');
    g.r(0, 0, 2, 14, '#8a5a32'); g.r(12, 0, 2, 14, '#8a5a32');
    g.line(2, 11, 11, 2, '#7a5432');
  }, { outlined: true });

  makeTex(scene, 'barrel', 12, 15, (g) => {
    g.r(1, 1, 10, 13, '#9a6236'); g.r(0, 3, 12, 9, '#9a6236'); g.r(2, 1, 2, 13, '#b07a44');
    g.r(0, 3, 12, 1, '#55555c'); g.r(0, 10, 12, 1, '#55555c'); g.r(1, 0, 10, 1, '#7a4b2a');
  }, { outlined: true });

  makeTex(scene, 'boat', 48, 20, (g) => {
    g.r(4, 7, 40, 2, '#a87442'); g.r(5, 9, 38, 5, '#8a5a32'); g.r(9, 14, 30, 2, '#6b4529');
    g.r(5, 11, 38, 1, '#f1e6c8'); g.r(10, 5, 2, 3, '#6b4529'); g.r(34, 5, 2, 3, '#6b4529');
    g.r(14, 8, 20, 1, '#6b4529');
    g.r(8, 17, 32, 1, 'rgba(200,235,255,0.5)');
  }, { outlined: true });

  makeTex(scene, 'hay', 16, 13, (g) => {
    g.r(0, 1, 16, 12, '#e2c062'); g.r(0, 1, 16, 2, '#f0d482'); g.r(0, 6, 16, 1, '#b8943c'); g.r(5, 1, 1, 12, '#b8943c'); g.r(11, 1, 1, 12, '#b8943c');
  }, { outlined: true });

  framesTex(scene, 'tuft', 8, 7, 2, (g, i) => {
    const s = i === 0 ? 0 : 1;
    g.r(1 + s, 1, 1, 5, '#4f9142'); g.r(3, 0, 1, 6, '#64a852'); g.r(5 - s, 2, 1, 4, '#4f9142'); g.r(1, 6, 6, 1, '#3f7a3a');
  });

  framesTex(scene, 'crop', 12, 12, 2, (g, i) => {
    g.r(5, 4, 2, 7, '#3f7a3a');
    const s = i;
    g.r(1 + s, 3, 4, 2, '#5fae4c'); g.r(7 - s, 2, 4, 2, '#5fae4c'); g.r(3, 6, 3, 2, '#7cc062'); g.r(7, 7, 3, 2, '#7cc062');
    g.p(5, 2, '#b9a6f2'); g.p(6, 1, '#b9a6f2');
  });

  framesTex(scene, 'cat', 14, 12, 3, (g, i) => {
    const c = '#e39a4b', d = '#b86f2c';
    g.r(3, 5, 7, 6, c); g.r(2, 9, 9, 2, c); g.r(4, 6, 1, 4, d); g.r(7, 6, 1, 4, d);
    g.r(2, 1, 7, 5, c); g.p(2, 0, c); g.p(8, 0, c); g.p(3, 1, '#f6b6a6'); g.p(7, 1, '#f6b6a6');
    g.p(4, 3, '#2a1c14'); g.p(6, 3, '#2a1c14'); g.p(5, 4, '#d06a6a');
    if (i === 0) { g.r(11, 6, 1, 4, c); g.p(12, 5, c); }
    else if (i === 1) { g.r(11, 8, 2, 2, c); g.p(12, 7, c); }
    else { g.r(10, 9, 3, 1, c); g.p(12, 8, c); }
  });

  framesTex(scene, 'bird', 9, 8, 4, (g, i) => {
    const c = '#e8e4dc', d = '#a8a296';
    if (i < 2) {
      g.r(2, 3, 5, 3, c); g.r(2, 5, 4, 1, d);
      if (i === 0) { g.r(5, 1, 3, 3, c); g.p(8, 2, '#e0a23a'); g.p(6, 2, '#2a1c14'); }
      else { g.r(5, 4, 3, 2, c); g.p(8, 5, '#e0a23a'); g.p(6, 4, '#2a1c14'); }
      g.p(3, 6, '#e0a23a'); g.p(5, 6, '#e0a23a'); g.p(1, 3, d);
    } else {
      g.r(3, 3, 4, 2, c); g.p(7, 3, '#e0a23a');
      if (i === 2) { g.r(1, 1, 3, 2, d); g.r(6, 1, 2, 2, d); } else { g.r(1, 5, 3, 1, d); g.r(6, 5, 2, 1, d); }
    }
  });

  framesTex(scene, 'butterfly', 7, 6, 2, (g, i) => {
    g.r(3, 1, 1, 4, '#3b3b44');
    if (i === 0) { g.r(0, 0, 3, 3, '#ffffff'); g.r(4, 0, 3, 3, '#ffffff'); g.r(1, 3, 2, 2, '#e8e8e8'); g.r(4, 3, 2, 2, '#e8e8e8'); }
    else { g.r(1, 1, 2, 3, '#ffffff'); g.r(4, 1, 2, 3, '#ffffff'); }
  }, { outlined: false });

  makeTex(scene, 'firefly', 5, 5, (g) => { g.r(1, 1, 3, 3, 'rgba(216,255,106,0.5)'); g.p(2, 2, '#fffbb0'); });
  makeTex(scene, 'puff', 8, 8, (g) => { g.circle(4, 4, 3, '#e6e2dc'); g.p(3, 3, '#ffffff'); });
  makeTex(scene, 'rain', 1, 6, (g) => { g.r(0, 0, 1, 6, '#c6dcff'); });
  makeTex(scene, 'leaf', 4, 3, (g) => { g.r(0, 1, 4, 1, '#ffffff'); g.r(1, 0, 2, 3, '#ffffff'); });
  makeTex(scene, 'dot', 2, 2, (g) => { g.r(0, 0, 2, 2, '#ffffff'); });
  makeTex(scene, 'sparkle', 7, 7, (g) => {
    g.r(3, 0, 1, 7, '#fff6c0'); g.r(0, 3, 7, 1, '#fff6c0'); g.p(3, 3, '#ffffff'); g.p(2, 2, '#ffe27a'); g.p(4, 4, '#ffe27a'); g.p(2, 4, '#ffe27a'); g.p(4, 2, '#ffe27a');
  });
  makeTex(scene, 'heart', 7, 6, (g) => { g.r(0, 1, 3, 2, '#e8506a'); g.r(4, 1, 3, 2, '#e8506a'); g.r(1, 0, 2, 1, '#e8506a'); g.r(4, 0, 2, 1, '#e8506a'); g.r(1, 3, 5, 1, '#e8506a'); g.r(2, 4, 3, 1, '#e8506a'); g.p(3, 5, '#e8506a'); g.p(1, 1, '#ffb3c4'); });
  makeTex(scene, 'coin', 5, 5, (g) => { g.r(1, 0, 3, 5, '#e2b23a'); g.r(0, 1, 5, 3, '#e2b23a'); g.p(1, 1, '#fff0a0'); }, { outlined: true });

  makeTex(scene, 'promptE', 13, 14, (g) => {
    g.r(1, 0, 11, 11, '#fffaf0'); g.r(0, 1, 13, 9, '#fffaf0'); g.r(5, 11, 3, 1, '#fffaf0'); g.p(6, 12, '#fffaf0');
    g.r(4, 2, 1, 7, '#2a1c14'); g.r(4, 2, 5, 1, '#2a1c14'); g.r(4, 5, 4, 1, '#2a1c14'); g.r(4, 8, 5, 1, '#2a1c14');
  }, { outlined: true });
  makeTex(scene, 'promptBang', 11, 14, (g) => {
    g.r(1, 0, 9, 11, '#ffd75e'); g.r(0, 1, 11, 9, '#ffd75e'); g.r(4, 11, 3, 1, '#ffd75e'); g.p(5, 12, '#ffd75e');
    g.r(5, 2, 1, 5, '#2a1c14'); g.r(5, 8, 1, 1, '#2a1c14');
  }, { outlined: true });

  ensureAnim(scene, 'fountain', 'fountain', [0, 1], 4);
  ensureAnim(scene, 'flag_blue', 'flag_blue', [0, 1], 3);
  ensureAnim(scene, 'flag_red', 'flag_red', [0, 1], 3);
  ensureAnim(scene, 'tuft', 'tuft', [0, 1], 2);
  ensureAnim(scene, 'crop', 'crop', [0, 1], 2);
  ensureAnim(scene, 'cat', 'cat', [0, 1, 2, 1], 3);
  ensureAnim(scene, 'bird-peck', 'bird', [0, 0, 1, 0, 1, 0], 4);
  ensureAnim(scene, 'bird-fly', 'bird', [2, 3], 10);
  ensureAnim(scene, 'butterfly', 'butterfly', [0, 1], 10);
}

// ---------------------------------------------------------------- buildings
const metaCache = new Map();

// Draws a building facade. Returns where windows, door and chimney ended up (relative to the sprite's top-left).
export function genBuilding(scene, key, b) {
  if (metaCache.has(key) && scene.textures.exists(key)) return metaCache.get(key);
  const W = b.w * 16, H = b.h * 16 + 12;
  const meta = { w: W, h: H, windows: [], chimney: null, door: null };
  makeTex(scene, key, W, H, (g, ctx) => {
    const s = b.style;
    if (s.type === 'tower') drawTower(g, W, H, b, meta);
    else if (s.type === 'glass') drawGlass(g, W, H, b, meta);
    else drawHouse(g, W, H, b, meta);
    outline(ctx, 0, 0, W, H);
  });
  metaCache.set(key, meta);
  return meta;
}

function shingles(g, x, y, w, h, c, inset = 6) {
  const d = shade(c, -0.22), l = shade(c, 0.2);
  g.r(x, y, w, h, c);
  for (let yy = 0; yy < h; yy += 4) {
    g.r(x, y + yy + 3, w, 1, d);
    const off = (yy / 4) % 2 ? 3 : 0;
    for (let xx = off; xx < w; xx += 6) g.r(x + xx, y + yy, 1, 3, d);
  }
  g.r(x, y, w, 2, l);
  g.r(x, y + h - 1, w, 1, shade(c, -0.4));
  // trapezoid: trim the top corners
  for (let i = 0; i < h; i++) {
    const cut = Math.round((1 - i / h) * inset);
    if (cut > 0) { g.ctx.clearRect(x, y + i, cut, 1); g.ctx.clearRect(x + w - cut, y + i, cut, 1); }
  }
}

function windowAt(g, x, y, w, h, s, meta) {
  g.r(x - 1, y - 1, w + 2, h + 2, s.trim);
  g.r(x, y, w, h, '#8ccbe0'); g.r(x, y, w, 2, '#b9e4f2'); g.p(x + 1, y + 1, '#ffffff');
  g.r(x + Math.floor(w / 2), y, 1, h, s.trim); g.r(x, y + Math.floor(h / 2), w, 1, s.trim);
  g.r(x - 2, y + h + 1, w + 4, 1, shade(s.trim, -0.2));
  if (s.flowers) {
    g.r(x - 1, y + h + 1, w + 2, 2, '#7a4b2a');
    for (let i = 0; i < w; i += 2) g.p(x + i, y + h, ['#e8506a', '#ffd75e', '#f6a5c0'][i % 3]);
  }
  meta.windows.push({ x, y, w, h });
}

function doorAt(g, H, b, s, meta) {
  const dx = b.door * 16 + 2, dy = H - 18;
  g.r(dx - 1, dy - 1, 14, 19, s.trim);
  g.r(dx, dy, 12, 18, s.doorColor || '#7a4b2a');
  g.r(dx + 4, dy, 1, 18, shade(s.doorColor || '#7a4b2a', -0.25));
  g.r(dx + 8, dy, 1, 18, shade(s.doorColor || '#7a4b2a', -0.25));
  g.p(dx, dy, s.trim); g.p(dx + 11, dy, s.trim);
  g.p(dx + 9, dy + 10, '#ffd75e');
  g.r(dx - 2, H - 2, 16, 2, '#9c9384');
  meta.door = { x: dx, y: dy, w: 12, h: 18 };
  return { dx, dy };
}

function signAt(g, x, y, icon) {
  g.r(x, y, 13, 10, '#7a5432');
  g.r(x + 1, y + 1, 11, 8, '#d9ad6c');
  drawIcon(g, x + 3, y + 1, icon);
}

function drawHouse(g, W, H, b, meta) {
  const s = b.style;
  const wallH = s.wallH || (b.h >= 5 ? 42 : 36);
  const wallTop = H - wallH;
  const roofTop = 8;

  // chimney sits behind the roof
  if (s.chimney) {
    const cx = W - 20;
    g.r(cx, 2, 8, roofTop + 12, '#9a4d3a');
    for (let y = 5; y < roofTop + 12; y += 4) g.r(cx, y, 8, 1, '#7a3a2c');
    g.r(cx - 1, 1, 10, 3, '#7a3a2c');
    meta.chimney = { x: cx + 4, y: 0 };
  }

  // walls
  const wx = 2, ww = W - 4;
  g.r(wx, wallTop, ww, wallH, s.wall);
  if (s.wallKind === 'stone') {
    for (let y = wallTop + 4, row = 0; y < H - 5; y += 6, row++) {
      g.r(wx, y, ww, 1, shade(s.wall, -0.18));
      for (let x = wx + (row % 2 ? 4 : 0); x < wx + ww; x += 9) g.r(x, y - 5, 1, 5, shade(s.wall, -0.18));
    }
  } else if (s.wallKind === 'planks') {
    for (let y = wallTop + 3; y < H - 5; y += 4) g.r(wx, y, ww, 1, shade(s.wall, -0.2));
    g.r(wx, wallTop, 2, wallH, shade(s.wall, -0.3)); g.r(W - 4, wallTop, 2, wallH, shade(s.wall, -0.3));
  } else {
    g.r(wx, wallTop, ww, 2, s.trim);
    g.r(wx, wallTop, 2, wallH, s.trim); g.r(W - 4, wallTop, 2, wallH, s.trim);
    g.r(wx + 2, wallTop + 2, ww - 4, 1, shade(s.wall, 0.25));
  }
  g.r(wx, H - 5, ww, 5, '#8d8579');
  for (let x = wx + 3; x < wx + ww; x += 7) g.r(x, H - 5, 1, 5, '#746c61');
  g.r(wx, H - 5, ww, 1, '#a39a8c');

  // barn cross-braces around the door
  if (s.barn) {
    const bx = b.door * 16 - 6;
    g.r(bx, H - 26, 28, 26, s.trim);
    g.r(bx + 2, H - 24, 24, 24, shade(s.wall, -0.15));
    g.line(bx + 2, H - 24, bx + 25, H - 1, s.trim);
    g.line(bx + 25, H - 24, bx + 2, H - 1, s.trim);
  }

  // windows on every column except the door (and banner columns)
  const skip = new Set([b.door]);
  if (s.banners) { skip.add(b.door - 1); skip.add(b.door + 1); }
  if (s.type === 'tent') {
    for (let col = 0; col < b.w; col++) {
      if (col === b.door) continue;
      const x = col * 16 + 1;
      g.r(x, H - 16, 14, 4, '#a87442'); g.r(x, H - 16, 14, 1, '#c08a55'); g.r(x + 1, H - 12, 12, 7, '#7a4b2a');
      const goods = ['#d8453a', '#ffd75e', '#4f97cf', '#7cc062', '#e39a4b'];
      for (let i = 0; i < 4; i++) g.r(x + 1 + i * 3, H - 19, 2, 3, goods[(col + i) % goods.length]);
      g.r(x + 2, wallTop + 6, 10, 8, shade(s.wall, -0.35));
      g.r(x + 3, wallTop + 7, 8, 2, '#f1e3c4');
    }
  } else if (!s.barn) {
    for (let col = 0; col < b.w; col++) {
      if (skip.has(col)) continue;
      windowAt(g, col * 16 + 3, wallTop + 9, 10, 9, s, meta);
    }
  }
  if (s.banners) {
    for (const col of [b.door - 1, b.door + 1]) {
      const x = col * 16 + 5;
      g.r(x - 1, wallTop + 3, 8, 1, '#5b3a22');
      g.r(x, wallTop + 4, 6, 16, s.banners);
      g.r(x + 2, wallTop + 8, 2, 4, '#ffd75e');
      g.ctx.clearRect(x + 2, wallTop + 18, 2, 2);
    }
  }
  if (s.herbs) {
    for (let x = 8; x < W - 8; x += 9) {
      if (Math.abs(x - (b.door * 16 + 8)) < 9) continue;
      g.r(x, wallTop + 2, 1, 2, '#5b3a22');
      g.r(x - 1, wallTop + 4, 3, 4, ['#5f9a4a', '#b9a65a', '#8f6fb5'][(x / 9) % 3 | 0]);
    }
  }

  const { dx } = doorAt(g, H, b, s, meta);
  if (s.sign) signAt(g, dx - 1, wallTop + 3, s.sign);

  // roof
  const roofBot = wallTop + 3;
  if (s.type === 'tent') {
    const rh = roofBot - roofTop;
    for (let x = 0, i = 0; x < W; x += 8, i++) g.r(x, roofTop, 8, rh, i % 2 ? '#f3e6c8' : s.roof);
    for (let x = 0, i = 0; x < W; x += 8, i++) g.ellipse(x + 4, roofBot, 3, 2, i % 2 ? '#f3e6c8' : s.roof);
    g.r(0, roofTop, W, 2, shade(s.roof, 0.25));
    for (let i = 0; i < rh; i++) {
      const cut = Math.round((1 - i / rh) * 8);
      if (cut > 0) { g.ctx.clearRect(0, roofTop + i, cut, 1); g.ctx.clearRect(W - cut, roofTop + i, cut, 1); }
    }
    for (let x = 12; x < W - 8; x += 16) { g.r(x, 0, 1, roofTop, '#5b4a3a'); g.r(x + 1, 1, 4, 3, ['#ffd75e', '#4f97cf', '#7cc062'][(x >> 4) % 3]); }
  } else {
    shingles(g, 0, roofTop, W, roofBot - roofTop, s.roof);
    // front gable with a small round window
    if (W >= 80) {
      const cx = W / 2, gh = Math.min(20, roofBot - roofTop - 6), gw = 30;
      for (let i = 0; i < gh; i++) {
        const half = Math.round(((gh - i) / gh) * (gw / 2));
        const y = roofBot - 1 - i;
        g.r(cx - half - 1, y, half * 2 + 2, 1, s.trim);
        g.r(cx - half + 1, y, Math.max(0, half * 2 - 2), 1, s.barn ? shade(s.wall, -0.1) : s.wall);
      }
      const wy = roofBot - Math.round(gh / 2) - 2;
      if (s.barn) {
        g.r(cx - 4, wy - 2, 8, 7, '#3b2a1e'); g.r(cx - 3, wy + 2, 6, 3, '#e2c062');
      } else {
        g.circle(cx, wy, 3, s.trim); g.circle(cx, wy, 2, '#8ccbe0');
        meta.windows.push({ x: cx - 2, y: wy - 2, w: 5, h: 5 });
      }
    }
  }
  if (s.owl) {
    const ox = 10, oy = roofTop - 6;
    g.r(ox, oy, 6, 7, '#8a6a4a'); g.r(ox + 1, oy + 3, 4, 4, '#c8ab84');
    g.p(ox + 1, oy + 1, '#ffd75e'); g.p(ox + 4, oy + 1, '#ffd75e'); g.p(ox, oy - 1, '#8a6a4a'); g.p(ox + 5, oy - 1, '#8a6a4a');
    g.p(ox + 2, oy + 7, '#e0a23a'); g.p(ox + 3, oy + 7, '#e0a23a');
  }
}

function drawTower(g, W, H, b, meta) {
  const s = b.style;
  const bodyTop = 40;
  g.r(6, bodyTop, W - 12, H - bodyTop, s.wall);
  g.r(6, bodyTop, 5, H - bodyTop, shade(s.wall, 0.15));
  g.r(W - 12, bodyTop, 6, H - bodyTop, shade(s.wall, -0.2));
  for (let y = bodyTop + 6, row = 0; y < H - 4; y += 7, row++) {
    g.r(6, y, W - 12, 1, shade(s.wall, -0.25));
    for (let x = 6 + (row % 2 ? 5 : 0); x < W - 6; x += 10) g.r(x, y - 6, 1, 6, shade(s.wall, -0.25));
  }
  // cone roof
  const coneH = 46;
  for (let i = 0; i < coneH; i++) {
    const half = Math.round((i / coneH) * (W / 2));
    const c = Math.floor(i / 7) % 2 ? shade(s.roof, -0.15) : s.roof;
    g.r(W / 2 - half, i + 2, half * 2, 1, c);
    g.r(W / 2 - half, i + 2, Math.max(1, Math.floor(half / 3)), 1, shade(s.roof, 0.2));
  }
  g.r(1, coneH, W - 2, 3, shade(s.roof, -0.35));
  g.r(W / 2 - 1, 0, 2, 3, '#ffd75e'); g.p(W / 2 - 2, 1, '#ffd75e'); g.p(W / 2 + 1, 1, '#ffd75e');
  // arched windows
  for (const y of [56, 80]) {
    const x = W / 2 - 3;
    g.r(x - 1, y - 1, 8, 11, s.trim);
    g.r(x, y, 6, 9, '#b9a6e8'); g.r(x + 1, y - 1, 4, 1, '#b9a6e8'); g.r(x + 3, y, 1, 9, s.trim);
    meta.windows.push({ x, y, w: 6, h: 9 });
  }
  g.r(6, H - 5, W - 12, 5, '#6f6a80');
  const { dx } = doorAt(g, H, b, { ...s, doorColor: '#5b3f8c' }, meta);
  signAt(g, dx - 1, H - 32, s.sign);
}

function drawGlass(g, W, H, b, meta) {
  const s = b.style;
  const top = 24;
  // arched glass roof
  for (let i = 0; i < 16; i++) {
    const half = Math.round(Math.sqrt(1 - ((16 - i) / 16) ** 2) * (W / 2 - 2));
    g.r(W / 2 - half, top - 16 + i + 2, half * 2, 1, '#bfe6dc');
  }
  g.r(2, top, W - 4, H - top - 10, s.wall);
  // plants inside
  const R = rng(5);
  for (let i = 0; i < 18; i++) {
    const x = 6 + Math.floor(R() * (W - 12)), y = H - 22 - Math.floor(R() * 26);
    g.circle(x, y, 2 + Math.floor(R() * 3), R() < 0.5 ? '#5fae4c' : '#3f8a4a');
  }
  for (let i = 0; i < 12; i++) g.p(6 + Math.floor(R() * (W - 12)), H - 22 - Math.floor(R() * 28), ['#f6a5c0', '#ffe27a', '#b9a6f2', '#ffffff'][i % 4]);
  // frames
  for (let x = 2; x < W - 1; x += 12) g.r(x, top - 6, 1, H - top - 4, s.trim);
  g.r(2, top, W - 4, 1, s.trim); g.r(2, top + 22, W - 4, 1, s.trim);
  for (let i = 0; i < 4; i++) g.line(8 + i * 22, top + 20, 18 + i * 22, top + 4, 'rgba(255,255,255,0.55)');
  meta.windows.push({ x: 4, y: top + 2, w: W - 8, h: H - top - 14 });
  // stone base
  g.r(2, H - 10, W - 4, 10, '#8d8579');
  for (let x = 5; x < W - 2; x += 8) g.r(x, H - 10, 1, 10, '#746c61');
  g.r(2, H - 10, W - 4, 1, '#a39a8c');
  const { dx } = doorAt(g, H, b, { ...s, trim: '#6b4a2f', doorColor: '#8a5a32' }, meta);
  signAt(g, dx - 1, H - 32, s.sign);
}
