import { F } from '../art/furniture.js';

// Google-Sheet_Project-1 (bike buyers): a stable where bikes are replacing ponies.
export default function stable(room, p) {
  const s = room.scene;
  room.setup({ w: 16, h: 10, floor: 'hay', floorColors: ['#c9a35a', '#a8853c'], wall: '#9c5a3a', trim: '#5b3a22' });
  const f = p.facts;

  room.onWall(F.window(s), 3, { fw: 1 });
  room.onWall(F.board(s, 'pivot', 40, 26), 6, { fw: 3, panel: true });
  room.onWall(F.window(s), 11, { fw: 1 });
  room.put(F.pony(s), 1, 4, { fw: 2, anim: 'f_pony_#a0643a', name: 'Pony', say: f.pony });
  room.put(F.pony(s, '#e8e0d0'), 1, 7, { fw: 2, anim: 'f_pony_#e8e0d0', name: 'Pony', say: f.pony });
  for (const [x, c] of [[10, '#c0392b'], [12, '#3f6ea8'], [14, '#4f8a5b']]) room.put(F.bike(s, c), x, 3, { name: 'Bikes for sale', say: f.bikes });

  room.keeper(8, 5);
  for (const [x, y] of [[13, 7], [14, 7], [14, 6]]) room.put('hay', x, y, { name: 'Hay', say: f.hay });
  room.put('barrel', 4, 8);
}
