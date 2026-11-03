// Draws a project's chart (SKY spec from projects.js) as chunky pixel blocks on a canvas,
// growing in over about a second.
const GOLD = '#ffd75e';
const FONT = '"Pixelify Sans", monospace';

export function renderChart(canvas, spec, color = '#7fe0ff') {
  const W = 560, H = 300;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const start = performance.now();

  const text = (str, x, y, size, col, align = 'center', base = 'alphabetic') => {
    ctx.font = `${size}px ${FONT}`;
    ctx.fillStyle = col;
    ctx.textAlign = align;
    ctx.textBaseline = base;
    ctx.fillText(str, x, y);
  };
  const wrap = (str, x, y, maxW, size, col) => {
    ctx.font = `${size}px ${FONT}`;
    const words = String(str).split(' ');
    let line = '', yy = y;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) { text(line, x, yy, size, col); line = w; yy += size + 4; }
      else line = test;
    }
    if (line) text(line, x, yy, size, col);
  };
  const block = (x, y, s, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), s, s); };

  function frame(now) {
    const t = Math.min(1, (now - start) / 1100);
    const e = 1 - (1 - t) ** 3;
    ctx.clearRect(0, 0, W, H);
    // dotted grid
    ctx.fillStyle = 'rgba(160,150,255,0.12)';
    for (let x = 0; x < W; x += 20) for (let y = 0; y < H; y += 4) ctx.fillRect(x, y, 1, 1);

    if (spec.type === 'bars') {
      const n = spec.items.length;
      const max = spec.max || Math.max(...spec.items.map((i) => i[1])) * 1.12;
      const base = H - 46, top = 46, slot = W / n, bw = Math.min(140, slot * 0.5), S = 10;
      ctx.fillStyle = '#6f6a9a';
      ctx.fillRect(20, base + 4, W - 40, 2);
      spec.items.forEach(([label, value, shown], i) => {
        const cx = slot * (i + 0.5);
        const full = Math.max(S, (value / max) * (base - top));
        const h = full * e;
        const rows = Math.floor(h / S);
        for (let r = 0; r < rows; r++) for (let c = 0; c < Math.floor(bw / S); c++) {
          block(cx - bw / 2 + c * S, base - (r + 1) * S, S - 2, r === rows - 1 && t === 1 ? GOLD : color);
        }
        if (t > 0.6) text(shown, cx, base - rows * S - 10, 26, '#ffffff');
        text(label, cx, base + 30, 18, '#d9d2ff');
      });
    } else if (spec.type === 'waffle') {
      const S = 22, ox = W / 2 - S * 5, oy = 14;
      const k = Math.round(spec.pct);
      const shown = Math.floor(100 * e);
      for (let i = 0; i < 100; i++) {
        const c = i < k ? GOLD : color;
        if (i < shown) block(ox + (i % 10) * S, oy + Math.floor(i / 10) * S, S - 4, i < k ? c : `${c}88`);
      }
      wrap(spec.caption, W / 2, oy + S * 10 + 20, W - 40, 18, '#ffffff');
    } else if (spec.type === 'timeline') {
      const y = H / 2;
      const years = spec.items.map((i) => i[0]);
      const y0 = Math.min(...years) - 15, y1 = Math.max(...years) + 15;
      ctx.fillStyle = '#6f6a9a';
      ctx.fillRect(20, y, (W - 40) * e, 3);
      spec.items.forEach(([year, label], i) => {
        const x = 20 + ((year - y0) / (y1 - y0)) * (W - 40);
        if (x > 20 + (W - 40) * e) return;
        block(x - 9, y - 8, 18, GOLD);
        text(String(year), x, y - 24, 30, '#ffffff');
        wrap(label, x, y + 44, 200, 17, '#d9d2ff');
        if (i > 0) { /* spacing handled by x */ }
      });
    } else {
      const n = spec.items.length, slot = W / n;
      spec.items.forEach((label, i) => {
        const appear = Math.min(1, Math.max(0, e * n - i));
        if (appear <= 0) return;
        const x = slot * (i + 0.5), y = 90;
        ctx.globalAlpha = appear;
        for (let a = 0; a < 8; a++) block(x + Math.cos((a / 8) * Math.PI * 2) * 28 - 3, y + Math.sin((a / 8) * Math.PI * 2) * 28 - 3, 6, color);
        block(x - 12, y - 12, 24, GOLD);
        text(String(i + 1), x, y + 1, 20, '#2a1c14', 'center', 'middle');
        wrap(label, x, y + 66, slot - 20, 18, '#ffffff');
        ctx.globalAlpha = 1;
      });
    }
    if (t < 1 && canvas.isConnected) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
