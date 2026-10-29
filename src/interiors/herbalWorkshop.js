import { F } from '../art/furniture.js';

// Web_blog_66070349_Thepthai: an herbalist's workshop with a mortar and the "green bean size" rule.
export default function herbalWorkshop(room, p) {
  const s = room.scene;
  room.setup({ w: 15, h: 10, floor: 'wood', floorColors: ['#a87a4a', '#966a3e'], wall: '#d6c39a', trim: '#3d7f74' });
  const f = p.facts;

  room.onWall(F.herbRack(s), 1);
  room.onWall(F.board(s, 'map', 32, 26), 4, { name: 'Map of Thailand', say: f.map });
  room.onWall(F.board(s, 'bean', 24, 16), 6, { fw: 1, offY: -6, name: 'House rule', say: f.sign });
  room.put(F.shelf(s, 'jar'), 8, 2, { fw: 2, name: 'Old jars', say: f.jars });
  room.onWall(F.herbRack(s), 11);

  room.floorDeco(F.rug(s, 64, 32, '#3d7f74', '#e9d7a8'), 5, 5);
  room.put(F.table(s, 32, '#7a4b2a'), 6, 5, { fw: 2, panel: true });
  room.put(F.mortar(s), 6, 5, { fw: 2, solid: false, offY: -10, depth: 5 * 16 + 17 });
  room.keeper(4, 6);
  room.put(F.cauldron(s, '#7cc062'), 11, 6, { fw: 2, anim: 'f_cauldron_#7cc062' });
  room.glow(12 * 16, 6 * 16 + 4, { tint: 0xa8ff9a, scale: 0.6, alpha: 0.3 });
  room.put(F.plant(s), 1, 8);
  room.put(F.plant(s, '#5fae4c'), 13, 8);
  room.put('barrel', 13, 2);
}
