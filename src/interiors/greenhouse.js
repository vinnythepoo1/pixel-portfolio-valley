import { F } from '../art/furniture.js';

// Web_blog_66070349_Ivish: a greenhouse with a SWOT garden and a heritage plaque.
export default function greenhouse(room, p) {
  const s = room.scene;
  room.setup({ w: 16, h: 10, floor: 'soil', floorColors: ['#7a5232', '#6b4529'], wall: '#cfe6d8', trim: '#eef3e8' });
  const f = p.facts;
  const plant = { fw: 2, name: 'SWOT planters', say: f.planters };

  room.onWall(F.window(s), 1, { fw: 1 });
  room.onWall(F.board(s, 'swot'), 3, { name: '4P poster', say: f.poster });
  room.onWall(F.board(s, 'plaque', 32, 20), 7, { offY: -4, name: 'Brass plaque', say: f.plaque });
  room.onWall(F.window(s), 11, { fw: 1 });
  room.onWall(F.window(s), 14, { fw: 1 });

  room.put(F.planter(s, '#7cc062'), 1, 4, plant);
  room.put(F.planter(s, '#e8742a'), 4, 4, plant);
  room.put(F.planter(s, '#4f97cf'), 10, 4, plant);
  room.put(F.planter(s, '#c0392b'), 13, 4, plant);
  room.put(F.display(s), 7, 6, { fw: 2, panel: true });
  room.keeper(11, 7);
  room.put(F.plant(s), 1, 8);
  room.put(F.plant(s, '#5fae4c'), 14, 8);
  room.put(F.plant(s, '#3f8a4a'), 4, 8);

  // a few butterflies got in
  [0xffe17a, 0xffa8d0, 0x9fd0ff].forEach((tint, i) => {
    const b = s.add.sprite(60 + i * 70, 70 + (i % 2) * 30, 'butterfly', '0').setDepth(9000).setTint(tint);
    b.play('butterfly');
    s.tweens.add({ targets: b, x: b.x + 30, y: b.y - 14, duration: 1800 + i * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  });
}
