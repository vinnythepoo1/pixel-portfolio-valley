import { F } from '../art/furniture.js';

// SQL_PROJECT_-1 (layoffs): a wizard's library where every shelf is a table.
export default function wizardArchive(room, p) {
  const s = room.scene;
  room.setup({ w: 14, h: 11, floor: 'stone', floorColors: ['#5b4f73', '#4f4466'], wall: '#3f3556', trim: '#d9a536' });
  const f = p.facts;
  const shelf = { fw: 2, name: 'Bookshelf', say: f.shelves };

  room.put(F.shelf(s, 'book', '#5b3a22'), 1, 2, shelf);
  room.put(F.shelf(s, 'book', '#5b3a22'), 3, 2, shelf);
  room.onWall(F.board(s, 'bars'), 6, { name: 'Ranking scroll', say: f.board });
  room.put(F.shelf(s, 'book', '#5b3a22'), 9, 2, shelf);
  room.put(F.shelf(s, 'book', '#5b3a22'), 11, 2, shelf);

  room.floorDeco(F.starRug(s), 5, 4);
  room.put(F.crystal(s), 7, 5, { panel: true });
  room.glow(7 * 16 + 8, 5 * 16 + 4, { tint: 0xa890ff, scale: 1, alpha: 0.5 });
  room.put(F.desk(s, '#5b3a22'), 1, 7, { fw: 2, name: 'Spell notes', say: f.desk });
  room.glow(2 * 16 + 12, 7 * 16 - 2, { scale: 0.5, alpha: 0.45 });
  room.keeper(10, 6);
  room.put(F.cauldron(s, '#8f7cf0'), 11, 8, { fw: 2, anim: 'f_cauldron_#8f7cf0' });
  room.put(F.candle(s), 1, 9, { solid: false });
  room.glow(1 * 16 + 8, 9 * 16 + 6, { scale: 0.4, alpha: 0.4 });
}
