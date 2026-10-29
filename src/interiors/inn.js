import { F } from '../art/furniture.js';

// Tableau_Project1 (Seattle Airbnb): a cozy inn with a price board and a guestbook.
export default function inn(room, p) {
  const s = room.scene;
  room.setup({ w: 16, h: 10, floor: 'wood', floorColors: ['#b07a44', '#9c6b3c'], wall: '#efe2c2', trim: '#7a4b2a' });
  const f = p.facts;

  room.put(F.fireplace(s), 1, 2, { fw: 2, anim: 'f_fire' });
  room.glow(2 * 16, 2 * 16 + 4, { scale: 1.2, alpha: 0.45 });
  room.onWall(F.board(s, 'price'), 4, { name: 'Price board', say: f.price });
  room.onWall(F.board(s, 'calendar'), 7, { name: 'Busy-season calendar', say: f.calendar });
  room.onWall(F.board(s, 'painting', 20, 18), 10, { fw: 1, offY: -4, name: 'Painting', say: f.painting });
  for (const [x, c] of [[12, '#c94f4f'], [13, '#3f6ea8'], [14, '#4f8a5b']]) room.put(F.bed(s, c), x, 3, { fh: 2, name: 'Beds', say: f.beds });

  room.put(F.counter(s, 64, '#7a4b2a', '#c08a55'), 2, 6, { fw: 4, panel: true });
  room.put(F.ledger(s), 3, 6, { fw: 2, solid: false, offY: -18, depth: 6 * 16 + 17 });
  room.keeper(6, 5);
  room.floorDeco(F.rug(s, 64, 32, '#a0413a', '#e2b23a'), 9, 6);
  room.put(F.table(s, 32, '#7a4b2a', '#f1e6c8'), 10, 7, { fw: 2 });
  room.put(F.candle(s), 10, 7, { fw: 2, solid: false, offY: -12, depth: 7 * 16 + 17 });
  room.put(F.plant(s), 14, 8);
  room.put('barrel', 1, 8);
}
