import { F } from '../art/furniture.js';

// olist-delivery-analytics: owl post office with parcels and a Brazil route map.
export default function courierRoost(room, p) {
  const s = room.scene;
  room.setup({ w: 15, h: 10, floor: 'stone', floorColors: ['#b8ad9a', '#a99f8c'], wall: '#e2d4b8', trim: '#3f6ea8' });
  const f = p.facts;

  room.onWall(F.board(s, 'map', 32, 26), 2, { name: 'Route map', say: f.map });
  room.put(F.shelf(s, 'box'), 5, 2, { fw: 2, name: 'Parcel shelf', say: f.parcels });
  room.onWall(F.window(s), 8, { fw: 1 });
  room.onWall(F.board(s, 'line'), 10, { name: 'Review chart', say: f.reviews });
  room.put(F.owlPerch(s), 13, 3, { anim: 'f_owl', name: 'Owl', say: f.owl });

  room.floorDeco(F.rug(s, 48, 32, '#3f6ea8', '#e2d4b8'), 6, 4);
  room.put(F.desk(s), 6, 5, { fw: 2, panel: true });
  room.keeper(9, 4);
  room.put(F.parcels(s), 1, 6, { name: 'Late parcels', say: f.parcels });
  room.put(F.parcels(s), 1, 7, { name: 'Late parcels', say: f.parcels });
  room.put(F.parcels(s), 13, 7, { name: 'Late parcels', say: f.parcels });
  room.put(F.plant(s), 13, 8);
}
