import { F } from '../art/furniture.js';

// dataco-supply-chain-analytics: warehouse with crates, hourglasses and a route map.
export default function caravanDepot(room, p) {
  const s = room.scene;
  room.setup({ w: 17, h: 10, floor: 'wood', floorColors: ['#8a6038', '#7a5230'], wall: '#a87b4f', trim: '#5b3a22' });
  const f = p.facts;
  const crates = { name: 'Crates', say: f.crates };

  for (const [x, y] of [[1, 2], [2, 2], [1, 3], [15, 5], [15, 6], [14, 6]]) room.put('crate', x, y, crates);
  room.put('crate', 2, 3, { ...crates, offY: -1 });
  room.put('barrel', 14, 2); room.put('barrel', 15, 2);
  room.onWall(F.board(s, 'bars', 40, 26), 4, { fw: 3, name: 'Shipping chart', say: f.board });
  room.onWall(F.window(s), 8, { fw: 1 });
  room.put(F.shelf(s, 'hourglass'), 10, 2, { fw: 2, name: 'Hourglasses', say: f.hourglass });
  room.put(F.shelf(s, 'box', '#7a4b2a'), 12, 2, { fw: 2, name: 'Hourglasses', say: f.hourglass });

  room.floorDeco(F.rug(s, 64, 48, '#7a3a2c', '#c99158'), 6, 4);
  room.put(F.mapTable(s), 7, 5, { fw: 2, panel: true });
  room.keeper(11, 5);
  room.put(F.parcels(s), 3, 7, { fw: 1, name: 'Crates', say: f.crates });
  room.put('hay', 13, 8);
  room.put('barrel', 1, 8);
}
