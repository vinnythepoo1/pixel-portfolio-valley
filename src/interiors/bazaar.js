import { F } from '../art/furniture.js';

// olist-ecommerce-analysis: indoor market with stalls and a trend chart.
export default function bazaar(room, p) {
  const s = room.scene;
  room.setup({ w: 18, h: 10, floor: 'tiles', floorColors: ['#c98c5a', '#a8703f'], wall: '#e9d3a8', trim: '#a0413a' });
  const f = p.facts;
  const stall = { fw: 2, name: 'Market stall', say: f.stall };

  room.put(F.stall(s, '#c4473a'), 1, 3, stall);
  room.put(F.stall(s, '#3f6ea8'), 4, 3, stall);
  room.put(F.stall(s, '#4f8a5b'), 13, 3, stall);
  room.onWall(F.board(s, 'line', 48, 26), 8, { fw: 3, name: 'Trend chart', say: f.chart });
  room.put('barrel', 16, 2); room.put('barrel', 16, 3);

  room.floorDeco(F.rug(s, 96, 48, '#a0413a', '#e2b23a'), 6, 4);
  room.put(F.table(s, 32, '#7a4b2a', '#e9d7a8'), 8, 5, { fw: 2, panel: true });
  room.put(F.ledger(s), 8, 5, { fw: 2, solid: false, offY: -12, depth: 5 * 16 + 17 });
  room.keeper(11, 5);
  room.put('crate', 1, 7, { name: 'Crate', say: f.crates });
  room.put('crate', 16, 7, { name: 'Crate', say: f.crates });
  room.put('crate', 16, 8, { name: 'Crate', say: f.crates });
  room.put(F.plant(s), 1, 8);
}
