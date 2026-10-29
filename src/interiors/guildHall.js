import { F } from '../art/furniture.js';

// hr-attrition-analysis: adventurers' guild with a quest board, roster and an exit door.
export default function guildHall(room, p) {
  const s = room.scene;
  room.setup({ w: 16, h: 11, floor: 'wood', floorColors: ['#9c6b3c', '#8a5d33'], wall: '#9e9586', trim: '#a0413a' });
  const f = p.facts;

  room.onWall(F.board(s, 'quest', 32, 26), 2, { panel: true });
  room.onWall(F.board(s, 'roster', 32, 24), 5, { name: 'Member roster', say: f.roster });
  room.onWall(F.banner(s, '#3f5fa8'), 8, { fw: 1 });
  room.onWall(F.banner(s, '#a0413a'), 10, { fw: 1 });
  room.onWall(F.exitDoor(s), 11, { fw: 1, offY: 2, name: 'Side door', say: f.exit });
  room.put(F.fireplace(s), 13, 2, { fw: 2, anim: 'f_fire' });
  room.glow(14 * 16, 2 * 16 + 4, { scale: 1.2, alpha: 0.45 });

  room.floorDeco(F.rug(s, 96, 48, '#3f5fa8', '#d9a536'), 3, 5);
  room.put(F.table(s, 64, '#7a4b2a'), 4, 6, { fw: 4, name: 'Guild records', say: f.table });
  room.put(F.candle(s), 5, 6, { solid: false, offY: -12, depth: 6 * 16 + 17 });
  room.put(F.candle(s), 7, 6, { solid: false, offY: -12, depth: 6 * 16 + 17 });
  room.glow(5 * 16 + 8, 6 * 16 - 2, { scale: 0.5, alpha: 0.4 });
  room.glow(7 * 16 + 8, 6 * 16 - 2, { scale: 0.5, alpha: 0.4 });
  room.keeper(10, 4);
  room.put(F.chest(s), 1, 9, { name: 'Prediction chest', say: f.chest });
  room.put('barrel', 14, 9);
  room.put(F.plant(s), 14, 6);
}
