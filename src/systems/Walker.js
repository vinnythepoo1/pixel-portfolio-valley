import { ensureCharAnims } from '../art/sprites.js';

export const DIR_VEC = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

// Shared base for the player and NPCs: a character sprite that walks on the tile grid.
// (x, y) is the feet position; the tile it stands on is (tx, ty).
export default class Walker {
  constructor(scene, grid, x, y, texKey) {
    this.scene = scene;
    this.grid = grid;
    this.key = texKey;
    ensureCharAnims(scene, texKey);
    this.sprite = scene.add.sprite(x, y, texKey, 'down0').setOrigin(0.5, 23 / 24);
    this.x = x;
    this.y = y;
    this.dir = 'down';
    this.path = null;
    this.speed = 70;
    this.sync();
  }

  get tx() { return Math.floor(this.x / 16); }
  get ty() { return Math.floor((this.y - 3) / 16); }

  setPos(x, y) { this.x = x; this.y = y; this.sync(); }

  sync() {
    this.sprite.setPosition(Math.round(this.x), Math.round(this.y));
    this.sprite.setDepth(this.y);
  }

  walkTo(tx, ty) {
    this.path = this.grid.path(this.tx, this.ty, tx, ty);
    return !!this.path;
  }

  // Moves along the current path. Returns true while moving.
  followPath(dt) {
    if (!this.path || !this.path.length) { this.path = null; return false; }
    const n = this.path[0];
    const gx = n.x * 16 + 8, gy = n.y * 16 + 12;
    const dx = gx - this.x, dy = gy - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dt;
    if (dist <= step) {
      this.x = gx; this.y = gy;
      this.path.shift();
      if (!this.path.length) { this.path = null; this.onArrive?.(); }
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
    if (dist > 0.5) this.face(dx, dy);
    return true;
  }

  face(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) this.dir = dx < 0 ? 'left' : 'right';
    else if (dy !== 0) this.dir = dy < 0 ? 'up' : 'down';
  }

  faceToward(x, y) { this.face(x - this.x, y - this.y); }

  animate(moving) {
    if (moving) this.sprite.anims.play(`${this.key}-${this.dir}`, true);
    else { this.sprite.anims.stop(); this.sprite.setFrame(`${this.dir}0`); }
  }
}
