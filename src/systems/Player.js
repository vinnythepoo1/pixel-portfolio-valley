import Walker from './Walker.js';
import { genChar } from '../art/sprites.js';

export const PLAYER_LOOK = { hair: '#5a3a22', shirt: '#3f7fbf', pants: '#3b3b5c', cape: '#c0453a', hat: '#c0453a', hatStyle: 'bandana' };

export default class Player extends Walker {
  constructor(scene, grid, x, y) {
    super(scene, grid, x, y, genChar(scene, 'player', PLAYER_LOOK));
    this.speed = 82;
    this.stepTimer = 0;
  }

  // ix / iy are -1, 0 or 1 from the keyboard or touch pad. Returns true while moving.
  control(dt, ix, iy) {
    let moving = false;
    if (ix || iy) {
      this.path = null;
      const len = Math.hypot(ix, iy);
      const vx = (ix / len) * this.speed * dt, vy = (iy / len) * this.speed * dt;
      if (vx) {
        if (this.grid.boxFree(this.x + vx, this.y)) this.x += vx;
        else if (!iy) this.slideY(vx);
      }
      if (vy) {
        if (this.grid.boxFree(this.x, this.y + vy)) this.y += vy;
        else if (!ix) this.slideX(vy);
      }
      if (ix && !iy) this.dir = ix < 0 ? 'left' : 'right';
      else if (iy && !ix) this.dir = iy < 0 ? 'up' : 'down';
      else if (!((this.dir === 'left' && ix < 0) || (this.dir === 'right' && ix > 0) || (this.dir === 'up' && iy < 0) || (this.dir === 'down' && iy > 0))) {
        this.dir = ix < 0 ? 'left' : 'right';
      }
      moving = true;
    } else if (this.path) {
      moving = this.followPath(dt);
    }
    this.animate(moving);
    this.sync();
    return moving;
  }

  // Blocked going up/down: if the tile straight ahead is open, ease sideways into that lane.
  slideX(vy) {
    const row = Math.floor((vy > 0 ? this.y + vy : this.y - 5 + vy) / 16);
    const col = Math.floor(this.x / 16);
    if (this.grid.isSolid(col, row)) return;
    const d = col * 16 + 8 - this.x;
    const nx = this.x + Math.sign(d) * Math.min(Math.abs(d), Math.abs(vy));
    if (this.grid.boxFree(nx, this.y)) this.x = nx;
  }

  // Blocked going left/right: ease up/down into the open row.
  slideY(vx) {
    const col = Math.floor((vx > 0 ? this.x + 5 + vx : this.x - 5 + vx) / 16);
    const row = Math.floor((this.y - 3) / 16);
    if (this.grid.isSolid(col, row)) return;
    const d = row * 16 + 12 - this.y;
    const ny = this.y + Math.sign(d) * Math.min(Math.abs(d), Math.abs(vx));
    if (this.grid.boxFree(this.x, ny)) this.y = ny;
  }
}
