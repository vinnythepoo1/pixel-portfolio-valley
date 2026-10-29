import Walker from './Walker.js';
import { genChar } from '../art/sprites.js';
import { say } from '../ui/DialogBox.js';

// A townsperson with a simple daily routine: wander their area by day, walk home and vanish at night.
export default class NPC extends Walker {
  constructor(scene, grid, def, hour) {
    const [sx, sy] = def.start;
    super(scene, grid, sx * 16 + 8, sy * 16 + 12, genChar(scene, `npc_${def.id}`, def.look));
    this.def = def;
    this.speed = def.speed || 36;
    this.wait = 500 + Math.random() * 2500;
    this.talking = 0;
    this.lineIndex = 0;
    this.home = false;
    if (!this.isAwake(hour)) { this.sprite.setVisible(false); this.home = true; }
  }

  isAwake(h) {
    if (this.def.always) return true;
    if (this.def.night) return h >= 19.5 || h < 6;
    return h >= 6 && h < 21;
  }

  get visible() { return this.sprite.visible; }

  update(dt, hour) {
    let moving = false;
    if (!this.isAwake(hour)) {
      if (this.home) return;
      if (!this.goingHome) {
        this.goingHome = true;
        this.talking = 0;
        if (!this.walkTo(this.def.home[0], this.def.home[1])) this.path = null;
      }
      moving = this.followPath(dt);
      if (!moving) { this.sprite.setVisible(false); this.home = true; this.goingHome = false; }
    } else {
      if (this.home) {
        this.home = false;
        this.setPos(this.def.home[0] * 16 + 8, this.def.home[1] * 16 + 12);
        this.sprite.setVisible(true).setAlpha(0);
        this.scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 400 });
        this.wait = 300;
      }
      if (this.talking > 0) {
        this.talking -= dt * 1000;
      } else if (this.path) {
        moving = this.followPath(dt);
      } else {
        this.wait -= dt * 1000;
        if (this.wait <= 0) {
          this.wander();
          this.wait = 1500 + Math.random() * 4500;
        }
      }
    }
    this.animate(moving);
    this.sync();
  }

  wander() {
    const [ax, ay, aw, ah] = this.def.area;
    for (let i = 0; i < 12; i++) {
      const tx = ax + Math.floor(Math.random() * aw), ty = ay + Math.floor(Math.random() * ah);
      if (this.grid.isSolid(tx, ty)) continue;
      if (Math.abs(tx - this.tx) + Math.abs(ty - this.ty) > 14) continue;
      if (this.walkTo(tx, ty)) return;
    }
  }

  talk(player) {
    this.path = null;
    this.talking = 6000;
    this.faceToward(player.x, player.y);
    this.animate(false);
    const lines = this.def.lines[this.lineIndex % this.def.lines.length];
    this.lineIndex++;
    say(lines, {
      name: this.def.name,
      portrait: this.scene.textures.getBase64(this.key, 'down0'),
      onDone: () => { this.talking = 1200; },
    });
  }
}
