import { state } from '../state.js';

// One in-game day lasts 6 real minutes (4 in-game minutes per real second).
const MIN_PER_SEC = 4;

export function advanceTime(ms) {
  state.minutes += (ms / 1000) * MIN_PER_SEC;
  if (state.minutes >= 1440) { state.minutes -= 1440; state.day++; }
}

export const hourNow = () => state.minutes / 60;

const NIGHT = [0.34, 0.38, 0.64];
// [hour, tint rgb, night amount 0..1]
const KEYS = [
  [0, NIGHT, 1], [5, NIGHT, 1], [6.5, [0.92, 0.76, 0.84], 0.4], [8, [1, 1, 1], 0],
  [17, [1, 1, 1], 0], [18.5, [1, 0.76, 0.58], 0.35], [20, NIGHT, 1], [24, NIGHT, 1],
];

export function lighting(minutes) {
  const h = minutes / 60;
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [h0, c0, n0] = KEYS[i], [h1, c1, n1] = KEYS[i + 1];
    if (h >= h0 && h <= h1) {
      const t = (h - h0) / (h1 - h0 || 1);
      const mix = (a, b) => a + (b - a) * t;
      return { r: mix(c0[0], c1[0]), g: mix(c0[1], c1[1]), b: mix(c0[2], c1[2]), night: mix(n0, n1) };
    }
  }
  return { r: 1, g: 1, b: 1, night: 0 };
}

export function clockText() {
  const m = Math.floor(state.minutes);
  const h = Math.floor(m / 60);
  const mm = String(Math.floor((m % 60) / 10) * 10).padStart(2, '0');
  const icon = h >= 6 && h < 18 ? '☀' : h >= 18 && h < 20 ? '🌇' : '🌙';
  const weather = state.weather === 'rain' ? ' · 🌧' : state.weather === 'leaves' ? ' · 🍂' : '';
  return `${icon} ${String(h).padStart(2, '0')}:${mm} · Day ${state.day}${weather}`;
}
