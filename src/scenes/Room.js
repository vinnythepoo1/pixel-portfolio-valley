import Phaser from 'phaser';
import { makeTex, rng, shade } from '../art/canvas.js';
import { genChar, ensureCharAnims } from '../art/sprites.js';
import Grid from '../systems/Grid.js';
import { say } from '../ui/DialogBox.js';
import { openProjectPanel } from '../ui/ProjectPanel.js';
import { audio } from '../systems/Audio.js';

// Helper that interior builders use to lay out a room.
// Rows 0-1 are the back wall, column 0 and the last column are side walls,
// the last row is the front wall with the exit gap in the middle.
export default class Room {
  constructor(scene, project) {
    this.scene = scene;
    this.project = project;
    this.items = [];
    this.keepers = [];
    this.mainMarkers = [];
  }

  setup({ w, h, floor = 'wood', floorColors = ['#9c6b3c', '#8a5d33'], wall = '#e8d8b0', trim = '#6b4a2f' }) {
    Object.assign(this, { W: w, H: h, floor, floorColors, wall, trim });
    this.exitX = Math.floor(w / 2);
    this.grid = new Grid(w, h);
    for (let x = 0; x < w; x++) { this.grid.set(x, 0); this.grid.set(x, 1); this.grid.set(x, h - 1); }
    for (let y = 0; y < h; y++) { this.grid.set(0, y); this.grid.set(w - 1, y); }
    this.grid.set(this.exitX, h - 1, 0);
    this.drawShell();
  }

  // Free-standing furniture. Its footprint is fw x fh tiles whose bottom row is ty.
  put(key, tx, ty, opts = {}) {
    const { fw = 1, fh = 1, solid = true, offY = 0, anim, tint } = opts;
    const x = (tx + fw / 2) * 16, y = (ty + 1) * 16 + offY;
    const frame = this.scene.textures.get(key).has('0') ? '0' : undefined;
    const s = this.scene.add.sprite(x, y, key, frame).setOrigin(0.5, 1).setDepth(opts.depth ?? y);
    if (anim) s.play(anim);
    if (tint) s.setTint(tint);
    if (solid) for (let j = ty - fh + 1; j <= ty; j++) for (let i = tx; i < tx + fw; i++) this.grid.set(i, j);
    this.addInteraction(opts, { x: tx * 16 - 3, y: (ty - fh + 1) * 16 - 3, w: fw * 16 + 6, h: fh * 16 + 6 }, x, y - s.height - 6);
    return s;
  }

  // Something hung on the back wall (boards, windows, banners).
  onWall(key, tx, opts = {}) {
    const { fw = 2, offY = 0 } = opts;
    const x = (tx + fw / 2) * 16, y = 30 + offY;
    const s = this.scene.add.image(x, y, key).setOrigin(0.5, 1).setDepth(1);
    this.addInteraction(opts, { x: tx * 16, y: 0, w: fw * 16, h: 32 }, x, y - s.height - 6);
    return s;
  }

  // Rugs and other flat things on the floor.
  floorDeco(key, tx, ty) {
    return this.scene.add.image(tx * 16, ty * 16, key).setOrigin(0).setDepth(-50);
  }

  glow(x, y, { scale = 0.8, tint = 0xffd682, alpha = 0.5 } = {}) {
    const g = this.scene.add.image(x, y, 'glow').setBlendMode(Phaser.BlendModes.ADD).setScale(scale).setTint(tint).setAlpha(alpha).setDepth(9000);
    this.scene.tweens.add({ targets: g, alpha: alpha * 0.7, scale: scale * 0.95, duration: 300 + Math.random() * 300, yoyo: true, repeat: -1 });
    return g;
  }

  keeper(tx, ty) {
    const k = this.project.keeper;
    const key = genChar(this.scene, `keeper_${this.project.id}`, k.look);
    ensureCharAnims(this.scene, key);
    const s = this.scene.add.sprite(tx * 16 + 8, ty * 16 + 12, key, 'down0').setOrigin(0.5, 23 / 24).setDepth(ty * 16 + 12);
    this.grid.set(tx, ty);
    const keeper = {
      sprite: s, x: s.x, y: s.y, visible: true, lineIndex: 0,
      talk: (player) => {
        const dx = player.x - s.x, dy = player.y - s.y;
        s.setFrame(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left0' : 'right0') : dy < 0 ? 'up0' : 'down0');
        const lines = k.lines[keeper.lineIndex % k.lines.length];
        keeper.lineIndex++;
        keeper.busyUntil = this.scene.time.now + 8000;
        say(lines, { name: k.name, portrait: this.scene.textures.getBase64(key, 'down0'), onDone: () => { keeper.busyUntil = this.scene.time.now + 1500; } });
      },
    };
    // look around now and then
    this.scene.time.addEvent({
      delay: 2600, loop: true,
      callback: () => {
        if (keeper.busyUntil > this.scene.time.now) return;
        s.setFrame(Phaser.Utils.Array.GetRandom(['down0', 'down0', 'left0', 'right0']));
      },
    });
    this.keepers.push(keeper);
    return keeper;
  }

  addInteraction(opts, rect, bx, by) {
    if (!opts.say && !opts.panel) return;
    const item = { rect, bx, by: Math.max(by, -4) };
    if (opts.panel) {
      item.act = () => {
        openProjectPanel(this.project);
        for (const m of this.mainMarkers) m.setVisible(false);
      };
      if (opts.main !== false) {
        const m = this.scene.add.image(bx, item.by, 'promptBang').setDepth(9999);
        this.scene.tweens.add({ targets: m, y: item.by - 3, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.mainMarkers.push(m);
        item.by -= 16;
      }
    } else {
      item.act = () => { audio.sfx('chime'); say(opts.say, { name: opts.name || '' }); };
    }
    this.items.push(item);
  }

  drawShell() {
    const { W, H } = this;
    const key = `shell_${this.project.id}`;
    makeTex(this.scene, key, W * 16, H * 16, (g) => {
      const R = rng(W * 31 + H);
      const [f1, f2] = this.floorColors;
      // floor
      for (let ty = 2; ty < H; ty++) {
        for (let tx = 0; tx < W; tx++) {
          const x = tx * 16, y = ty * 16;
          switch (this.floor) {
            case 'wood':
              for (let row = 0; row < 4; row++) {
                g.r(x, y + row * 4, 16, 4, R() < 0.5 ? f1 : f2);
                g.r(x, y + row * 4 + 3, 16, 1, shade(f1, -0.25));
                g.r(x + ((tx * 7 + row * 5 + ty * 3) % 16), y + row * 4, 1, 3, shade(f1, -0.25));
              }
              break;
            case 'stone':
              g.r(x, y, 16, 16, (tx + ty) % 3 ? f1 : f2);
              g.r(x, y + 15, 16, 1, shade(f1, -0.2)); g.r(x + 15, y, 1, 16, shade(f1, -0.2));
              g.r(x + 1, y + 1, 6, 1, shade(f1, 0.12));
              for (let i = 0; i < 4; i++) g.p(x + Math.floor(R() * 15), y + Math.floor(R() * 15), shade(f1, -0.1));
              break;
            case 'checker':
              for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) g.r(x + i * 8, y + j * 8, 8, 8, (i + j) % 2 ? f2 : f1);
              break;
            case 'tiles':
              g.r(x, y, 16, 16, f1);
              g.r(x, y + 7, 16, 1, f2); g.r(x, y + 15, 16, 1, f2); g.r(x + 7, y, 1, 7, f2); g.r(x + 15, y + 8, 1, 7, f2);
              g.r(x + 1, y + 1, 5, 1, shade(f1, 0.15));
              break;
            case 'hay':
              g.r(x, y, 16, 16, f1);
              for (let i = 0; i < 10; i++) { const sx = x + Math.floor(R() * 14), sy = y + Math.floor(R() * 15); g.r(sx, sy, 3, 1, R() < 0.5 ? f2 : shade(f1, 0.2)); }
              break;
            case 'soil':
              g.r(x, y, 16, 16, f1);
              for (let i = 0; i < 8; i++) g.p(x + Math.floor(R() * 16), y + Math.floor(R() * 16), R() < 0.5 ? f2 : shade(f1, 0.15));
              if (tx === this.exitX || tx === this.exitX - 1) { g.r(x + 2, y + 2, 12, 12, '#a49b8c'); g.r(x + 2, y + 2, 12, 1, '#bcb3a2'); }
              break;
            default:
              g.r(x, y, 16, 16, f1);
          }
        }
      }
      // back wall
      g.r(0, 0, W * 16, 32, this.wall);
      g.r(0, 0, W * 16, 4, shade(this.wall, -0.45));
      g.r(0, 4, W * 16, 1, shade(this.wall, 0.2));
      g.r(0, 19, W * 16, 13, shade(this.wall, -0.15));
      for (let x = 4; x < W * 16; x += 8) g.r(x, 20, 1, 10, shade(this.wall, -0.28));
      g.r(0, 19, W * 16, 1, this.trim);
      g.r(0, 30, W * 16, 2, shade(this.trim, -0.2));
      g.r(16, 32, W * 16 - 32, 3, 'rgba(0,0,0,0.18)');
      // side walls
      const cap = '#4a3628', voidC = '#140e0b';
      g.r(0, 0, 16, H * 16, voidC); g.r(8, 0, 8, H * 16, cap); g.r(15, 4, 1, H * 16 - 20, shade(cap, 0.25));
      g.r((W - 1) * 16, 0, 16, H * 16, voidC); g.r((W - 1) * 16, 0, 8, H * 16, cap); g.r((W - 1) * 16, 4, 1, H * 16 - 20, shade(cap, 0.25));
      // front wall with the exit gap and a doormat
      const fy = (H - 1) * 16;
      g.r(0, fy, W * 16, 16, voidC);
      g.r(8, fy, W * 16 - 16, 8, cap);
      g.r(8, fy, W * 16 - 16, 1, shade(cap, 0.25));
      const ex = this.exitX * 16;
      g.r(ex, fy, 16, 16, this.floorColors[0]);
      g.r(ex + 1, fy + 1, 14, 12, '#8a3b30'); g.r(ex + 3, fy + 3, 10, 8, '#c0503a');
      for (let i = 0; i < 3; i++) g.r(ex + 4, fy + 4 + i * 3, 8, 1, '#e2b23a');
    });
    this.scene.add.image(0, 0, key).setOrigin(0).setDepth(-100);
  }
}
