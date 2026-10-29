const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Tile collision grid plus breadth-first pathfinding (used for click-to-walk and NPCs).
export default class Grid {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.cells = new Uint8Array(w * h);
  }

  static fromRows(rows) {
    const g = new Grid(rows[0].length, rows.length);
    rows.forEach((row, y) => row.forEach((v, x) => g.set(x, y, v)));
    return g;
  }

  inside(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  set(x, y, v = 1) { if (this.inside(x, y)) this.cells[y * this.w + x] = v ? 1 : 0; }
  isSolid(x, y) { return !this.inside(x, y) || this.cells[y * this.w + x] === 1; }
  solidAtPx(px, py) { return this.isSolid(Math.floor(px / 16), Math.floor(py / 16)); }

  // Feet hitbox: 10px wide, 5px tall, anchored at the feet point (x, y).
  boxFree(x, y) {
    return !this.solidAtPx(x - 5, y - 5) && !this.solidAtPx(x + 4.99, y - 5) && !this.solidAtPx(x - 5, y - 0.01) && !this.solidAtPx(x + 4.99, y - 0.01);
  }

  nearestFree(tx, ty, maxR = 3) {
    if (!this.isSolid(tx, ty)) return [tx, ty];
    for (let r = 1; r <= maxR; r++) {
      for (let j = -r; j <= r; j++) {
        for (let i = -r; i <= r; i++) {
          if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue;
          if (!this.isSolid(tx + i, ty + j)) return [tx + i, ty + j];
        }
      }
    }
    return null;
  }

  // Returns [{x,y}, ...] from the start tile to the goal tile, or null.
  path(sx, sy, tx, ty, maxLen = 4000) {
    const free = this.nearestFree(tx, ty);
    if (!free) return null;
    [tx, ty] = free;
    if (sx === tx && sy === ty) return [{ x: tx, y: ty }];
    const W = this.w, N = W * this.h;
    const prev = new Int32Array(N).fill(-1);
    const q = new Int32Array(N);
    const start = sy * W + sx, goal = ty * W + tx;
    if (start < 0 || start >= N) return null;
    let head = 0, tail = 0;
    q[tail++] = start;
    prev[start] = start;
    while (head < tail && tail < maxLen) {
      const c = q[head++];
      if (c === goal) break;
      const cx = c % W, cy = (c / W) | 0;
      for (const [dx, dy] of DIRS) {
        const nx = cx + dx, ny = cy + dy;
        if (this.isSolid(nx, ny)) continue;
        const ni = ny * W + nx;
        if (prev[ni] !== -1) continue;
        prev[ni] = c;
        q[tail++] = ni;
      }
    }
    if (prev[goal] === -1) return null;
    const out = [];
    for (let c = goal; c !== start; c = prev[c]) out.push({ x: c % W, y: (c / W) | 0 });
    out.push({ x: sx, y: sy });
    return out.reverse();
  }
}
