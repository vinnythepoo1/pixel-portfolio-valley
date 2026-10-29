import { PROJECTS } from './projects.js';
import { TOWN_NPCS } from './npcs.js';
import { T } from '../art/sprites.js';
import { rng } from '../art/canvas.js';

export const MAP_W = 64;
export const MAP_H = 48;
export const SPAWN = { tx: 31, ty: 27 };

// Which district a tile belongs to (used for the name banner).
export function districtAt(tx, ty) {
  if (ty >= 30) return 'harbor';
  if (ty <= 17) return tx <= 31 ? 'market' : 'herbal';
  return 'plaza';
}

// Builds the town: ground tiles, a solid/blocked grid, and a list of decorations to place.
export function buildTown() {
  const R = rng(1337);
  const grid = (v) => Array.from({ length: MAP_H }, () => Array(MAP_W).fill(v));
  const ground = grid(T.GRASS);
  const solid = grid(0);
  const reserved = grid(0);
  const decor = [];

  const inMap = (x, y) => x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
  const reserve = (x, y, w = 1, h = 1, m = 0) => {
    for (let j = y - m; j < y + h + m; j++) for (let i = x - m; i < x + w + m; i++) if (inMap(i, j)) reserved[j][i] = 1;
  };
  const fill = (x, y, w, h, t, margin = 0) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (inMap(i, j)) ground[j][i] = t;
    reserve(x, y, w, h, margin);
  };
  const block = (x, y, w = 1, h = 1) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (inMap(i, j)) solid[j][i] = 1;
  };
  // Decoration with a footprint (fw x fh tiles ending at row ty).
  const add = (d) => {
    const item = { fw: 1, fh: 1, solid: true, ...d };
    decor.push(item);
    reserve(item.tx, item.ty - item.fh + 1, item.fw, item.fh, 1);
    if (item.solid) block(item.tx, item.ty - item.fh + 1, item.fw, item.fh);
    return item;
  };

  // grass variety
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const v = R();
      ground[y][x] = v < 0.12 ? T.GRASS2 : v < 0.16 ? T.FLOWERS : T.GRASS;
    }
  }

  // harbor: road, beach, sea, docks
  fill(2, 37, 60, 2, T.PATH, 1);
  fill(0, 39, MAP_W, 2, T.SAND, 0);
  fill(0, 41, MAP_W, 7, T.WATER_A, 0);
  fill(8, 41, 2, 4, T.DOCK);
  fill(27, 41, 2, 5, T.DOCK);
  fill(56, 41, 3, 4, T.DOCK);

  // roads and plaza
  fill(2, 11, 60, 2, T.PATH, 1);
  fill(31, 13, 2, 5, T.PATH, 1);
  fill(23, 18, 18, 12, T.STONE, 1);
  fill(31, 30, 2, 7, T.PATH, 1);
  fill(10, 23, 13, 2, T.PATH, 1);
  fill(41, 23, 11, 2, T.PATH, 1);

  // pond at the end of the east road
  for (let y = 18; y < 30; y++) {
    for (let x = 50; x < 62; x++) {
      const d = ((x - 55.5) / 3.6) ** 2 + ((y - 23.5) / 3.2) ** 2;
      if (d <= 1) fill(x, y, 1, 1, T.WATER_A, 1);
      else if (d <= 1.6) fill(x, y, 1, 1, T.SAND, 1);
    }
  }

  // herb field (Herbal Lane)
  fill(52, 5, 8, 5, T.FIELD, 1);
  block(52, 5, 8, 5);
  for (let y = 5; y < 10; y++) for (let x = 52; x < 60; x++) decor.push({ kind: 'crop', tex: 'crop', anim: 'crop', tx: x, ty: y, fw: 1, fh: 1, solid: false, offY: -2 });
  decor.push({
    kind: 'zone', tx: 52, ty: 9, fw: 8, fh: 5, solid: false,
    name: 'Herb field',
    say: ['Rows of mint, lemongrass and clove. Herbal Lane\'s secret ingredients.'],
  });

  // buildings: footprint is solid except the door, plus a path from the door to the nearest road
  for (const p of PROJECTS) {
    const b = p.building;
    block(b.x, b.y, b.w, b.h);
    reserve(b.x, b.y, b.w, b.h, 1);
    const dx = b.x + b.door, dy = b.y + b.h - 1;
    solid[dy][dx] = 0;
    for (let y = dy + 1; y < MAP_H && ground[y][dx] !== T.PATH; y++) fill(dx, y, 1, 1, T.PATH, 1);
  }

  // water is solid (docks are not)
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) if (ground[y][x] === T.WATER_A) solid[y][x] = 1;

  // forest border
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) if (x < 2 || x > 61 || y < 2) solid[y][x] = 1;
  for (let x = 1; x < MAP_W; x += 2) decor.push({ kind: 'tree', tex: R() < 0.3 ? 'tree3' : 'tree0', tx: x, ty: 1, solid: false });
  for (let x = 0; x < MAP_W; x += 2) decor.push({ kind: 'tree', tex: 'tree3', tx: x, ty: 0, solid: false, offY: -6 });
  for (let y = 3; y < 39; y += 2) {
    decor.push({ kind: 'tree', tex: R() < 0.5 ? 'tree3' : 'tree0', tx: 0, ty: y, solid: false });
    decor.push({ kind: 'tree', tex: R() < 0.5 ? 'tree3' : 'tree0', tx: 1, ty: y + 1, solid: false });
    decor.push({ kind: 'tree', tex: R() < 0.5 ? 'tree3' : 'tree0', tx: 62, ty: y, solid: false });
    decor.push({ kind: 'tree', tex: R() < 0.5 ? 'tree3' : 'tree0', tx: 63, ty: y + 1, solid: false });
  }

  // plaza
  add({ kind: 'fountain', tex: 'fountain', anim: 'fountain', tx: 30, ty: 23, fw: 4, fh: 2, act: 'fountain', name: 'Fountain' });
  add({ kind: 'board', tex: 'board', tx: 26, ty: 20, fw: 2, act: 'list', name: 'Notice board' });
  add({ kind: 'mailbox', tex: 'mailbox', tx: 37, ty: 20, act: 'about', name: 'Mailbox' });
  const benchLine = ['You sit for a moment. Somewhere, a bird sings and a cart rattles past.', 'The town feels alive.'];
  add({ kind: 'bench', tex: 'bench', tx: 25, ty: 26, fw: 2, say: benchLine, name: 'Bench' });
  add({ kind: 'bench', tex: 'bench', tx: 37, ty: 26, fw: 2, say: benchLine, name: 'Bench' });

  // lamps
  const lamps = [[23, 18], [40, 18], [23, 29], [40, 29], [30, 14], [33, 14], [30, 34], [33, 34],
    [10, 10], [19, 10], [28, 10], [35, 10], [43, 10], [51, 10], [10, 36], [17, 36], [26, 36], [44, 36], [56, 36], [21, 22], [42, 22]];
  for (const [x, y] of lamps) add({ kind: 'lamp', tex: 'lamp', tx: x, ty: y });

  // signposts
  add({ kind: 'sign', tex: 'sign', tx: 30, ty: 13, name: 'Signpost', say: ['← Market Hill: dashboards & BI tools', '→ Herbal Lane: brand case studies'] });
  add({ kind: 'sign', tex: 'sign', tx: 30, ty: 31, name: 'Signpost', say: ['↓ Harbor Ward: Python & machine-learning projects'] });
  add({ kind: 'sign', tex: 'sign', tx: 21, ty: 25, name: 'Signpost', say: ['← The Old Well. Make a wish!'] });

  // west end: well
  add({ kind: 'well', tex: 'well', tx: 8, ty: 24, fw: 2, name: 'Old Well', say: ['You peer into the well. A distant echo answers: "git push... push... push..."'] });
  add({ kind: 'bench', tex: 'bench', tx: 12, ty: 21, fw: 2, say: benchLine, name: 'Bench' });

  // harbor props
  add({ kind: 'bell', tex: 'bell', tx: 53, ty: 35, act: 'bell', name: 'Guild bell' });
  add({ kind: 'flag', tex: 'flag_blue', anim: 'flag_blue', tx: 45, ty: 35 });
  add({ kind: 'flag', tex: 'flag_blue', anim: 'flag_blue', tx: 52, ty: 35 });
  for (const [x, y] of [[57, 36], [58, 36], [4, 39], [33, 40]]) add({ kind: 'crate', tex: 'crate', tx: x, ty: y, name: 'Crate', say: ['A crate stamped "FRAGILE: DATA INSIDE".'] });
  for (const [x, y] of [[59, 36], [54, 39], [60, 39], [5, 39]]) add({ kind: 'barrel', tex: 'barrel', tx: x, ty: y, name: 'Barrel', say: ['A barrel of salted fish. Smells like the sea.'] });
  const boats = [
    [10, 43, "A small boat named the 'Pull Request'. It's waiting for a review."],
    [29, 44, "The 'Merge Conflict'. Two captains, one steering wheel."],
    [53, 42, "The 'Main Branch', the sturdiest ship in the harbor."],
  ];
  for (const [x, y, line] of boats) add({ kind: 'boat', tex: 'boat', tx: x, ty: y, fw: 3, solid: false, name: 'Boat', say: [line] });

  // market hill props
  add({ kind: 'hay', tex: 'hay', tx: 18, ty: 9, name: 'Hay', say: ['Fresh hay. The pony inside will be happy.'] });
  add({ kind: 'hay', tex: 'hay', tx: 19, ty: 9 });
  add({ kind: 'barrel', tex: 'barrel', tx: 10, ty: 9, name: 'Barrel', say: ['A barrel of the Cozy Inn\'s famous apple cider.'] });
  add({ kind: 'flag', tex: 'flag_red', anim: 'flag_red', tx: 3, ty: 9 });
  add({ kind: 'bush', tex: 'bush', tx: 34, ty: 9 });
  add({ kind: 'bush', tex: 'bush', tx: 43, ty: 9 });
  add({ kind: 'bush', tex: 'bush', tx: 50, ty: 9 });

  // keep NPC spawn and home tiles clear
  for (const n of TOWN_NPCS) { reserve(n.start[0], n.start[1], 1, 1, 1); reserve(n.home[0], n.home[1], 1, 1, 1); }

  // random trees, bushes and grass tufts on free grass
  const isGrass = (x, y) => ground[y][x] <= T.FLOWERS;
  const treeAt = grid(0);
  const grassSpots = [];
  for (let y = 2; y < 37; y++) {
    for (let x = 2; x < 62; x++) {
      if (!isGrass(x, y) || reserved[y][x] || solid[y][x]) continue;
      grassSpots.push([x, y]);
      let near = false;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (treeAt[y + j]?.[x + i]) near = true;
      const v = R();
      if (!near && v < 0.085) {
        treeAt[y][x] = 1;
        const tex = R() < 0.18 ? 'tree1' : R() < 0.3 ? 'tree2' : R() < 0.5 ? 'tree3' : 'tree0';
        decor.push({ kind: 'tree', tex, tx: x, ty: y, solid: true, fruit: tex === 'tree2' });
        block(x, y);
      } else if (!near && v < 0.1) {
        treeAt[y][x] = 1;
        decor.push({ kind: 'bush', tex: 'bush', tx: x, ty: y, solid: true });
        block(x, y);
      } else if (v > 0.93) {
        decor.push({ kind: 'tuft', tex: 'tuft', anim: 'tuft', tx: x, ty: y, solid: false, offY: -2 - Math.floor(R() * 8), dx: Math.floor(R() * 10) - 5 });
      }
    }
  }

  return { ground, solid, decor, grassSpots };
}
