import { F } from '../art/furniture.js';

// shopee-health-wellness-analysis: potion shop with a sales ledger.
export default function apothecary(room, p) {
  const s = room.scene;
  room.setup({ w: 15, h: 10, floor: 'checker', floorColors: ['#e8dcc0', '#c9d8b4'], wall: '#cfe0c4', trim: '#5b7a4a' });
  const f = p.facts;

  room.put(F.shelf(s, 'potion'), 1, 2, { fw: 2, name: 'Potion shelf', say: f.shelf });
  room.put(F.shelf(s, 'jar'), 3, 2, { fw: 2, name: 'Potion shelf', say: f.shelf });
  room.onWall(F.board(s, 'bars'), 6, { name: 'Wall ledger', say: f.board });
  room.onWall(F.window(s), 9, { fw: 1 });
  room.put(F.shelf(s, 'potion', '#7a4b2a'), 12, 2, { fw: 2, name: 'Potion shelf', say: f.shelf });

  room.floorDeco(F.rug(s, 80, 32, '#5b7a4a', '#e2c062'), 5, 5);
  room.put(F.counter(s, 64), 4, 4, { fw: 4, panel: true });
  room.put(F.ledger(s), 5, 4, { fw: 2, solid: false, offY: -18, depth: 4 * 16 + 17 });
  room.keeper(9, 4);
  room.put(F.cauldron(s, '#d04a6a'), 11, 6, { fw: 2, anim: 'f_cauldron_#d04a6a', name: 'Cauldron', say: f.cauldron });
  room.glow(12 * 16, 6 * 16 + 4, { tint: 0xff8fb0, scale: 0.6, alpha: 0.35 });
  room.put(F.plant(s), 1, 8);
  room.put(F.plant(s, '#5fae4c'), 13, 8);
  room.put('barrel', 1, 5);
}
