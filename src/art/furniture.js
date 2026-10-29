import { makeTex, framesTex, rng, shade, ensureAnim } from './canvas.js';
import { drawIcon } from './sprites.js';

// Each function draws one piece of interior furniture (once) and returns its texture key.
const WOOD = '#9c6b3c';
const PALETTE = ['#d04a6a', '#4f97cf', '#7cc062', '#ffd75e', '#b9a6f2', '#e39a4b', '#3f8a7a', '#f6a5c0'];

export const F = {
  shelf(scene, kind = 'potion', wood = WOOD, w = 32) {
    const key = `f_shelf_${kind}_${wood}_${w}`;
    return makeTex(scene, key, w, 38, (g) => {
      const R = rng(kind.length * 97 + w);
      g.r(0, 0, w, 38, wood); g.r(2, 2, w - 4, 34, shade(wood, -0.35)); g.r(0, 0, w, 2, shade(wood, 0.2));
      for (const sy of [13, 24, 35]) {
        g.r(1, sy, w - 2, 2, shade(wood, 0.1));
        let x = 3;
        while (x < w - 5) {
          const c = PALETTE[Math.floor(R() * PALETTE.length)];
          if (kind === 'potion') {
            const h = 5 + Math.floor(R() * 3);
            g.r(x, sy - h, 3, h, c); g.r(x + 1, sy - h - 1, 1, 1, '#c8b48a'); g.p(x, sy - h + 1, '#ffffff');
            x += 4;
          } else if (kind === 'book') {
            const h = 7 + Math.floor(R() * 3), bw = 2 + Math.floor(R() * 2);
            g.r(x, sy - h, bw, h, c); g.r(x, sy - h + 2, bw, 1, shade(c, 0.35));
            x += bw + (R() < 0.2 ? 2 : 0);
          } else if (kind === 'jar') {
            g.r(x, sy - 6, 5, 6, '#d8ecef'); g.r(x + 1, sy - 4, 3, 4, c); g.r(x, sy - 7, 5, 1, '#8a5a32');
            x += 6;
          } else if (kind === 'box') {
            const bw = 5 + Math.floor(R() * 3);
            g.r(x, sy - 6, bw, 6, '#c99158'); g.r(x, sy - 4, bw, 1, '#8a5a32'); g.r(x + 2, sy - 6, 1, 6, '#8a5a32');
            x += bw + 1;
          } else if (kind === 'hourglass') {
            g.r(x, sy - 8, 5, 1, '#6b4a2f'); g.r(x, sy - 1, 5, 1, '#6b4a2f');
            g.r(x + 1, sy - 7, 3, 2, '#d8ecef'); g.r(x + 2, sy - 5, 1, 2, '#d8ecef'); g.r(x + 1, sy - 3, 3, 2, '#e2c062');
            x += 7;
          }
        }
      }
    }, { outlined: true });
  },

  counter(scene, w = 64, wood = WOOD, top = '#c99158') {
    const key = `f_counter_${w}_${wood}_${top}`;
    return makeTex(scene, key, w, 24, (g) => {
      g.r(0, 0, w, 7, top); g.r(0, 0, w, 1, shade(top, 0.25)); g.r(0, 6, w, 1, shade(top, -0.3));
      g.r(1, 7, w - 2, 17, wood);
      for (let x = 6; x < w - 3; x += 10) g.r(x, 9, 1, 13, shade(wood, -0.25));
      g.r(1, 22, w - 2, 2, shade(wood, -0.35));
    }, { outlined: true });
  },

  table(scene, w = 32, wood = WOOD, cloth = null) {
    const key = `f_table_${w}_${wood}_${cloth}`;
    return makeTex(scene, key, w, 20, (g) => {
      g.r(0, 0, w, 10, wood); g.r(0, 0, w, 1, shade(wood, 0.25)); g.r(0, 10, w, 3, shade(wood, -0.3));
      g.r(2, 13, 3, 7, shade(wood, -0.3)); g.r(w - 5, 13, 3, 7, shade(wood, -0.3));
      if (cloth) { g.r(4, 0, w - 8, 10, cloth); g.r(4, 10, w - 8, 4, shade(cloth, -0.2)); }
    }, { outlined: true });
  },

  rug(scene, w, h, c1, c2) {
    const key = `f_rug_${w}_${h}_${c1}_${c2}`;
    return makeTex(scene, key, w, h, (g) => {
      g.r(0, 0, w, h, c1); g.r(3, 3, w - 6, h - 6, c2); g.r(5, 5, w - 10, h - 10, c1);
      for (let x = 8; x < w - 8; x += 6) { g.p(x, Math.floor(h / 2), c2); g.p(x + 3, Math.floor(h / 2) - 1, c2); }
      for (let x = 1; x < w; x += 3) { g.p(x, 0, shade(c1, 0.3)); g.p(x, h - 1, shade(c1, 0.3)); }
    });
  },

  starRug(scene) {
    return makeTex(scene, 'f_starrug', 64, 40, (g) => {
      g.ellipse(32, 20, 31, 19, '#2e2450'); g.ellipse(32, 20, 28, 16, '#3f3170');
      g.ellipse(32, 20, 25, 14, '#2e2450');
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        g.line(32, 20, 32 + Math.cos(a) * 18, 20 + Math.sin(a) * 11, '#d9a536');
      }
      g.circle(32, 20, 3, '#ffd75e');
    });
  },

  plant(scene, leaf = '#4f9142') {
    const key = `f_plant_${leaf}`;
    return makeTex(scene, key, 16, 22, (g) => {
      g.r(4, 14, 8, 8, '#b8653a'); g.r(3, 14, 10, 2, '#cf7c4c');
      g.circle(8, 9, 5, shade(leaf, -0.15)); g.circle(6, 7, 3, leaf); g.circle(10, 6, 3, leaf); g.p(6, 5, shade(leaf, 0.3));
    }, { outlined: true });
  },

  bed(scene, blanket = '#c94f4f') {
    const key = `f_bed_${blanket}`;
    return makeTex(scene, key, 16, 30, (g) => {
      g.r(0, 0, 16, 7, '#7a4b2a'); g.r(0, 0, 16, 1, '#9c6b3c');
      g.r(1, 6, 14, 22, '#f1e6c8'); g.r(3, 8, 10, 5, '#ffffff');
      g.r(1, 14, 14, 14, blanket); g.r(1, 14, 14, 2, shade(blanket, 0.25)); g.r(1, 27, 14, 1, shade(blanket, -0.3));
      g.r(1, 28, 2, 2, '#5b3a22'); g.r(13, 28, 2, 2, '#5b3a22');
    }, { outlined: true });
  },

  fireplace(scene) {
    framesTex(scene, 'f_fire', 32, 36, 2, (g, i) => {
      g.r(0, 4, 32, 32, '#8d8579');
      for (let y = 8; y < 36; y += 6) g.r(0, y, 32, 1, '#746c61');
      g.r(0, 2, 32, 4, '#7a4b2a'); g.r(0, 2, 32, 1, '#9c6b3c');
      g.r(7, 14, 18, 22, '#2a1c14');
      g.r(9, 32, 14, 3, '#6b4a2f');
      const f = i === 0 ? [[10, 24, 4, 8], [15, 20, 3, 12], [19, 25, 3, 7]] : [[11, 22, 3, 10], [15, 23, 4, 9], [19, 21, 3, 11]];
      for (const [x, y, w, h] of f) { g.r(x, y, w, h, '#e8742a'); g.r(x + 1, y + 3, Math.max(1, w - 2), h - 3, '#ffd75e'); }
    });
    ensureAnim(scene, 'f_fire', 'f_fire', [0, 1], 5);
    return 'f_fire';
  },

  cauldron(scene, brew = '#7cc062') {
    const key = `f_cauldron_${brew}`;
    framesTex(scene, key, 24, 22, 2, (g, i) => {
      g.r(5, 18, 3, 3, '#3b3b44'); g.r(16, 18, 3, 3, '#3b3b44');
      g.ellipse(12, 12, 10, 8, '#3b3b44'); g.ellipse(12, 7, 10, 3, '#55555c'); g.ellipse(12, 7, 8, 2, brew);
      const b = i === 0 ? [[8, 3], [14, 1]] : [[10, 1], [16, 4]];
      for (const [x, y] of b) g.r(x, y, 2, 2, shade(brew, 0.35));
      g.r(6, 10, 2, 6, '#6e6e78');
    });
    ensureAnim(scene, key, key, [0, 1], 3);
    return key;
  },

  // Wall boards and charts. kind decides what is drawn on it.
  board(scene, kind, w = 32, h = 24) {
    const key = `f_board_${kind}_${w}_${h}`;
    return makeTex(scene, key, w, h, (g) => {
      const chalk = ['pivot', 'quest'].includes(kind);
      const frame = kind === 'plaque' ? '#a87a1e' : '#6b4a2f';
      const bg = chalk ? (kind === 'pivot' ? '#2f4a3a' : '#b5824c') : kind === 'plaque' ? '#e2b23a' : kind === 'map' ? '#e9d7a8' : '#f4ead2';
      g.r(0, 0, w, h, frame); g.r(2, 2, w - 4, h - 4, bg);
      const R = rng(kind.length * 13 + w);
      switch (kind) {
        case 'bars': {
          const hs = [0.4, 0.75, 0.55, 0.95, 0.65, 0.3];
          const n = Math.floor((w - 8) / 4);
          for (let i = 0; i < n; i++) {
            const bh = Math.round(hs[i % hs.length] * (h - 10));
            g.r(4 + i * 4, h - 4 - bh, 3, bh, PALETTE[i % 4]);
          }
          g.r(3, h - 4, w - 6, 1, '#6b4a2f');
          break;
        }
        case 'line': {
          const pts = [];
          const n = 7;
          for (let i = 0; i < n; i++) pts.push([4 + Math.round((i * (w - 8)) / (n - 1)), h - 6 - Math.round((i === 5 ? 0.9 : 0.15 + R() * 0.25) * (h - 12))]);
          for (let i = 0; i < n - 1; i++) g.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], '#c0392b');
          g.r(pts[5][0] - 1, pts[5][1] - 1, 3, 3, '#ffd75e');
          g.r(3, h - 4, w - 6, 1, '#6b4a2f'); g.r(3, 3, 1, h - 7, '#6b4a2f');
          break;
        }
        case 'map': {
          g.circle(Math.floor(w * 0.4), Math.floor(h * 0.5), Math.floor(h * 0.3), '#9ccf7a');
          g.circle(Math.floor(w * 0.62), Math.floor(h * 0.4), Math.floor(h * 0.22), '#9ccf7a');
          const stops = [[6, h - 6], [Math.floor(w * 0.35), Math.floor(h * 0.45)], [Math.floor(w * 0.6), Math.floor(h * 0.35)], [w - 6, 6]];
          for (let i = 0; i < stops.length - 1; i++) {
            const [x0, y0] = stops[i], [x1, y1] = stops[i + 1];
            const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
            for (let k = 0; k <= n; k += 2) g.p(Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n), '#c0392b');
          }
          for (const [x, y] of stops) g.r(x - 1, y - 1, 3, 3, '#3f6ea8');
          g.r(stops[2][0] - 2, stops[2][1] - 2, 5, 5, '#c0392b');
          break;
        }
        case 'pins':
        case 'quest':
          for (let i = 0; i < 4; i++) {
            const x = 4 + (i % 2) * Math.floor((w - 8) / 2), y = 4 + Math.floor(i / 2) * Math.floor((h - 8) / 2);
            const pw = Math.floor((w - 12) / 2), ph = Math.floor((h - 12) / 2);
            g.r(x, y, pw, ph, '#f6ecd0'); g.r(x + 2, y + 3, pw - 4, 1, '#a89878'); g.r(x + 2, y + 5, pw - 6, 1, '#a89878');
            if (kind === 'quest') { g.r(x + pw - 4, y + 2, 1, 4, '#c0392b'); g.p(x + pw - 4, y + 7, '#c0392b'); }
            g.p(x + Math.floor(pw / 2), y, '#c0392b');
          }
          break;
        case 'roster':
          for (let i = 0; i < 8; i++) {
            const x = 4 + (i % 4) * 6, y = 4 + Math.floor(i / 4) * 9;
            g.r(x, y, 5, 7, '#e8dcc0'); g.r(x + 1, y + 1, 3, 3, ['#f1c7a1', '#c98d5e', '#8a5a3a'][i % 3]); g.r(x + 1, y + 1, 3, 1, ['#5a3a22', '#2a1c14', '#d9a03a'][i % 3]);
            g.r(x + 1, y + 4, 3, 2, PALETTE[i % PALETTE.length]);
            if (i === 2 || i === 7) { g.line(x, y, x + 4, y + 6, '#c0392b'); g.line(x + 4, y, x, y + 6, '#c0392b'); }
          }
          break;
        case 'price':
          for (let i = 0; i < 4; i++) {
            const y = 4 + i * 4;
            drawIcon(g, 3, y - 2, i === 3 ? 'bed' : 'coin');
            g.r(11, y, 4 + i * 4, 2, i === 3 ? '#c0392b' : '#a87a1e');
          }
          break;
        case 'calendar':
          for (let i = 0; i < 12; i++) {
            const x = 4 + (i % 4) * 6, y = 4 + Math.floor(i / 4) * 6;
            g.r(x, y, 5, 5, i === 4 || i === 5 ? '#e8742a' : '#e2d6b6');
          }
          break;
        case 'pivot':
          g.r(4, 7, w - 8, 1, '#e8f0e6');
          for (let x = 4 + 8; x < w - 4; x += 7) g.r(x, 4, 1, h - 8, '#e8f0e6');
          for (let y = 11; y < h - 3; y += 4) for (let x = 14; x < w - 5; x += 7) g.r(x, y, 3 + Math.floor(R() * 3), 1, '#e8f0e6');
          g.r(5, 4, 5, 2, '#ffd75e');
          break;
        case 'swot': {
          const hw = Math.floor((w - 6) / 2), hh = Math.floor((h - 6) / 2);
          [['#7cc062', 3, 3], ['#e8742a', 3 + hw, 3], ['#4f97cf', 3, 3 + hh], ['#c0392b', 3 + hw, 3 + hh]].forEach(([c, x, y]) => g.r(x, y, hw - 1, hh - 1, c));
          break;
        }
        case 'plaque':
          g.r(5, 6, w - 10, 1, '#7a5a12'); g.r(7, 10, w - 14, 1, '#7a5a12'); g.r(5, 14, w - 10, 1, '#7a5a12');
          break;
        case 'bean':
          g.r(5, h / 2 - 1, w - 12, 3, '#4f97cf'); g.r(w - 8, h / 2 - 3, 3, 5, '#ffffff'); g.r(w - 9, h / 2 - 4, 3, 2, '#7cc062');
          break;
        case 'painting':
          g.r(2, 2, w - 4, h - 4, '#9fd3e8'); g.r(2, h - 9, w - 4, 7, '#5fae4c');
          for (let i = 0; i < 5; i++) g.r(4 + i * 3, h - 9 - (i % 3 + 2) * 2, 2, (i % 3 + 2) * 2, '#8a86a0');
          g.r(w - 7, 4, 3, 3, '#ffd75e');
          break;
        default:
          break;
      }
    }, { outlined: true });
  },

  window(scene) {
    return makeTex(scene, 'f_window', 20, 20, (g) => {
      g.r(0, 0, 20, 20, '#6b4a2f'); g.r(2, 2, 16, 15, '#9fd3e8'); g.r(2, 2, 16, 4, '#c9ecf7');
      g.r(9, 2, 2, 15, '#6b4a2f'); g.r(2, 9, 16, 2, '#6b4a2f'); g.r(0, 17, 20, 3, '#9c6b3c');
      g.r(1, 1, 3, 15, '#c94f4f'); g.r(16, 1, 3, 15, '#c94f4f');
    }, { outlined: true });
  },

  crystal(scene) {
    return makeTex(scene, 'f_crystal', 16, 24, (g) => {
      g.r(3, 15, 10, 3, '#5b3a22'); g.r(5, 18, 6, 4, '#4a2e1a'); g.r(2, 22, 12, 2, '#5b3a22');
      g.circle(8, 9, 6, '#8f7cf0'); g.circle(8, 9, 4, '#b5a8ff'); g.r(5, 5, 2, 2, '#ffffff'); g.p(10, 11, '#e8e0ff');
    }, { outlined: true });
  },

  parcels(scene) {
    return makeTex(scene, 'f_parcels', 22, 20, (g) => {
      g.r(1, 8, 11, 12, '#c99158'); g.r(11, 10, 10, 10, '#b07a44'); g.r(4, 1, 10, 8, '#d9a86a');
      g.r(6, 8, 1, 12, '#7a5432'); g.r(1, 13, 11, 1, '#7a5432'); g.r(15, 10, 1, 10, '#7a5432'); g.r(8, 1, 1, 8, '#7a5432');
      g.r(16, 13, 3, 2, '#f3ead2');
    }, { outlined: true });
  },

  desk(scene, wood = WOOD) {
    const key = `f_desk_${wood}`;
    return makeTex(scene, key, 32, 24, (g) => {
      g.r(0, 4, 32, 10, wood); g.r(0, 4, 32, 1, shade(wood, 0.25)); g.r(0, 14, 32, 3, shade(wood, -0.3));
      g.r(2, 17, 3, 7, shade(wood, -0.3)); g.r(27, 17, 3, 7, shade(wood, -0.3));
      g.r(5, 5, 9, 7, '#f3ead2'); g.r(7, 7, 5, 1, '#a89878'); g.r(7, 9, 4, 1, '#a89878');
      g.line(17, 1, 20, 9, '#ffffff'); g.r(20, 9, 3, 3, '#2a1c14');
      g.r(26, 3, 3, 7, '#f1e6c8'); g.r(26, 9, 3, 2, '#a87a1e'); g.p(27, 2, '#ffd75e');
    }, { outlined: true });
  },

  stall(scene, c1 = '#c4473a', c2 = '#f3e6c8') {
    const key = `f_stall_${c1}`;
    return makeTex(scene, key, 32, 34, (g) => {
      g.r(2, 8, 2, 26, '#6b4a2f'); g.r(28, 8, 2, 26, '#6b4a2f');
      for (let x = 0, i = 0; x < 32; x += 6, i++) g.r(x, 0, 6, 9, i % 2 ? c2 : c1);
      for (let x = 0, i = 0; x < 32; x += 6, i++) g.ellipse(x + 3, 9, 2, 1, i % 2 ? c2 : c1);
      g.r(0, 20, 32, 4, '#c08a55'); g.r(1, 24, 30, 10, '#9c6b3c');
      const R = rng(c1.length * 7 + c1.charCodeAt(1));
      for (let i = 0; i < 8; i++) g.circle(4 + i * 3.5, 18, 1, PALETTE[Math.floor(R() * PALETTE.length)]);
    }, { outlined: true });
  },

  bike(scene, color = '#c0392b') {
    const key = `f_bike_${color}`;
    return makeTex(scene, key, 24, 16, (g) => {
      for (const cx of [5, 18]) { g.circle(cx, 10, 5, '#2a1c14'); g.circle(cx, 10, 3, 'rgba(0,0,0,0)'); g.ctx.clearRect(cx - 2, 8, 5, 5); g.p(cx, 10, '#9aa0a8'); }
      g.line(5, 10, 10, 4, color); g.line(10, 4, 18, 4, color); g.line(18, 10, 17, 3, color); g.line(5, 10, 12, 10, color); g.line(12, 10, 10, 4, color);
      g.r(8, 2, 4, 1, '#3b2a1e'); g.r(16, 1, 4, 1, '#3b3b44');
    }, { outlined: true });
  },

  pony(scene, coat = '#a0643a') {
    const key = `f_pony_${coat}`;
    framesTex(scene, key, 32, 26, 2, (g, i) => {
      const mane = '#4a2e1a';
      g.r(6, 9, 18, 9, coat); g.r(7, 9, 16, 2, shade(coat, 0.2));
      for (const x of [7, 11, 19, 22]) g.r(x, 18, 2, 7, shade(coat, -0.15));
      for (const x of [7, 11, 19, 22]) g.r(x, 24, 2, 1, '#2a1c14');
      const hy = i === 0 ? 2 : 5;
      g.r(22, hy + 1, 4, 9, coat); g.r(24, hy, 6, 5, coat); g.r(28, hy + 2, 2, 3, shade(coat, 0.25));
      g.p(26, hy + 1, '#2a1c14'); g.p(24, hy - 1, coat);
      g.r(21, hy, 2, 9, mane);
      if (i === 0) g.r(3, 9, 3, 9, mane); else { g.r(3, 10, 3, 5, mane); g.r(2, 15, 3, 3, mane); }
    });
    ensureAnim(scene, key, key, [0, 0, 0, 1, 0, 0], 2);
    return key;
  },

  planter(scene, flower) {
    const key = `f_planter_${flower}`;
    return makeTex(scene, key, 32, 20, (g) => {
      for (let i = 0; i < 5; i++) {
        const x = 3 + i * 6;
        g.r(x + 1, 2, 1, 8, '#3f7a3a'); g.r(x - 1, 4, 2, 2, '#5fae4c'); g.r(x + 2, 5, 2, 2, '#5fae4c');
        g.r(x, 1, 3, 2, flower); g.p(x + 1, 0, flower);
      }
      g.r(0, 9, 32, 3, '#5b3a22'); g.r(0, 11, 32, 9, '#8a5a32'); g.r(0, 11, 32, 1, '#a87442');
      for (let x = 6; x < 32; x += 8) g.r(x, 12, 1, 8, '#6b4529');
    }, { outlined: true });
  },

  herbRack(scene) {
    return makeTex(scene, 'f_herbrack', 32, 18, (g) => {
      g.r(0, 1, 32, 2, '#7a4b2a');
      ['#5f9a4a', '#b9a65a', '#8f6fb5', '#7cc062'].forEach((c, i) => {
        const x = 3 + i * 8;
        g.r(x + 1, 3, 1, 3, '#c8b48a');
        g.r(x, 6, 4, 8, c); g.r(x + 1, 14, 2, 2, shade(c, -0.25)); g.r(x - 1, 7, 1, 4, c); g.r(x + 4, 8, 1, 4, c);
      });
    }, { outlined: true });
  },

  banner(scene, color) {
    const key = `f_banner_${color}`;
    return makeTex(scene, key, 14, 28, (g, ctx) => {
      g.r(0, 0, 14, 2, '#6b4a2f');
      g.r(2, 2, 10, 24, color); g.r(2, 2, 2, 24, shade(color, 0.2));
      g.r(5, 8, 4, 6, '#ffd75e'); g.r(6, 7, 2, 1, '#ffd75e');
      ctx.clearRect(5, 22, 4, 4); ctx.clearRect(6, 21, 2, 1);
    }, { outlined: true });
  },

  exitDoor(scene) {
    return makeTex(scene, 'f_exitdoor', 20, 32, (g) => {
      g.r(0, 0, 20, 8, '#c0392b'); g.r(2, 2, 16, 4, '#e8705a');
      g.r(5, 3, 1, 2, '#fff'); g.r(8, 3, 2, 1, '#fff'); g.r(12, 3, 3, 1, '#fff');
      g.r(1, 9, 18, 23, '#5b3a22'); g.r(3, 11, 14, 21, '#8a5a32'); g.r(9, 11, 1, 21, '#6b4529'); g.p(14, 22, '#ffd75e');
    }, { outlined: true });
  },

  chest(scene) {
    return makeTex(scene, 'f_chest', 18, 15, (g) => {
      g.r(1, 1, 16, 6, '#a87442'); g.r(0, 6, 18, 9, '#8a5a32'); g.r(0, 6, 18, 1, '#5b3a22');
      g.r(3, 1, 2, 14, '#d9a536'); g.r(13, 1, 2, 14, '#d9a536'); g.r(8, 6, 2, 3, '#ffd75e');
    }, { outlined: true });
  },

  ledger(scene) {
    return makeTex(scene, 'f_ledger', 14, 9, (g) => {
      g.r(0, 1, 14, 8, '#7a4b2a'); g.r(1, 0, 6, 8, '#f6ecd0'); g.r(7, 0, 6, 8, '#efe0b0');
      g.r(2, 2, 4, 1, '#a89878'); g.r(2, 4, 3, 1, '#a89878'); g.r(8, 2, 4, 1, '#a89878'); g.r(8, 4, 4, 1, '#c0392b');
    }, { outlined: true });
  },

  mapTable(scene) {
    return makeTex(scene, 'f_maptable', 36, 24, (g) => {
      g.r(0, 0, 36, 13, '#7a4b2a'); g.r(0, 13, 36, 3, '#5b3a22'); g.r(2, 16, 3, 8, '#5b3a22'); g.r(31, 16, 3, 8, '#5b3a22');
      g.r(3, 2, 30, 10, '#e9d7a8'); g.circle(13, 7, 3, '#9ccf7a'); g.circle(24, 6, 3, '#9ccf7a');
      for (let x = 5; x < 31; x += 2) g.p(x, 7 + Math.round(Math.sin(x / 3) * 2), '#c0392b');
      g.r(29, 3, 2, 2, '#3f6ea8'); g.r(5, 9, 2, 2, '#3f6ea8');
      g.r(15, 0, 3, 3, '#e2c062'); g.r(16, 1, 1, 1, '#d9dde3');
    }, { outlined: true });
  },

  mortar(scene) {
    return makeTex(scene, 'f_mortar', 14, 11, (g) => {
      g.ellipse(7, 7, 6, 3, '#9a9a9a'); g.ellipse(7, 5, 6, 1, '#b5b5b5'); g.ellipse(7, 5, 4, 1, '#7cc062');
      g.line(9, 0, 11, 5, '#7a5432');
    }, { outlined: true });
  },

  display(scene) {
    return makeTex(scene, 'f_display', 34, 22, (g) => {
      g.r(0, 6, 34, 9, '#e8e0cc'); g.r(0, 6, 34, 1, '#ffffff'); g.r(0, 15, 34, 2, '#b5a888');
      g.r(3, 17, 3, 5, '#8a7a5a'); g.r(28, 17, 3, 5, '#8a7a5a');
      ['#3f8a4a', '#ffffff', '#3f8a4a', '#ffffff', '#3f8a4a'].forEach((c, i) => {
        const x = 3 + i * 6;
        g.r(x, 1, 4, 7, c); g.r(x + 1, 3, 2, 2, i % 2 ? '#3f8a4a' : '#ffd75e'); g.r(x + 1, 0, 2, 1, '#b5b5b5');
      });
    }, { outlined: true });
  },

  owlPerch(scene) {
    framesTex(scene, 'f_owl', 16, 30, 2, (g, i) => {
      g.r(7, 12, 2, 16, '#6b4a2f'); g.r(3, 27, 10, 3, '#5b3a22'); g.r(2, 11, 12, 2, '#6b4a2f');
      g.r(4, 2, 8, 9, '#8a6a4a'); g.r(5, 5, 6, 6, '#c8ab84'); g.p(4, 1, '#8a6a4a'); g.p(11, 1, '#8a6a4a');
      if (i === 0) { g.r(5, 3, 2, 2, '#ffd75e'); g.r(9, 3, 2, 2, '#ffd75e'); g.p(6, 4, '#2a1c14'); g.p(9, 4, '#2a1c14'); }
      else { g.r(5, 4, 2, 1, '#2a1c14'); g.r(9, 4, 2, 1, '#2a1c14'); }
      g.p(7, 6, '#e0a23a'); g.p(8, 6, '#e0a23a');
    });
    ensureAnim(scene, 'f_owl', 'f_owl', [0, 0, 0, 0, 1], 3);
    return 'f_owl';
  },

  candle(scene) {
    return makeTex(scene, 'f_candle', 6, 10, (g) => {
      g.r(1, 4, 4, 6, '#f1e6c8'); g.r(2, 1, 2, 3, '#ffd75e'); g.p(2, 0, '#fff6c0'); g.r(0, 9, 6, 1, '#a87a1e');
    }, { outlined: true });
  },
};
