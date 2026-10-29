// Tiny WebAudio synth: background tune + sound effects. Muted by default.
let ctx = null;
let master = null;
let musicTimer = null;
let step = 0;
let nextTime = 0;
let muted = true;
try { muted = localStorage.getItem('ppt-muted') !== '0'; } catch { /* storage blocked: stay muted */ }

const VOL = 0.5;
// A gentle pentatonic loop (MIDI notes, 0 = rest). Bass on every 4th step.
const MELODY = [72, 0, 76, 79, 81, 0, 79, 76, 74, 0, 72, 74, 76, 0, 0, 0, 69, 0, 72, 76, 74, 0, 72, 69, 67, 0, 69, 72, 72, 0, 0, 0];
const BASS = [48, 48, 45, 45, 41, 41, 43, 43];
const midi = (n) => 440 * 2 ** ((n - 69) / 12);

function tone(freq, start, dur, type = 'square', vol = 0.08, slideTo = null) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.linearRampToValueAtTime(vol, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g).connect(master);
  o.start(start);
  o.stop(start + dur + 0.05);
}

function scheduleMusic() {
  if (!ctx || muted) return;
  const beat = 0.32;
  while (nextTime < ctx.currentTime + 0.6) {
    const n = MELODY[step % MELODY.length];
    if (n) tone(midi(n), nextTime, beat * 1.6, 'triangle', 0.035);
    if (step % 4 === 0) tone(midi(BASS[(step / 4) % BASS.length]), nextTime, beat * 3.5, 'sine', 0.05);
    nextTime += beat;
    step++;
  }
}

const SFX = {
  blip: (t) => tone(620 + Math.random() * 140, t, 0.03, 'square', 0.025),
  door: (t) => { tone(330, t, 0.12, 'triangle', 0.1); tone(247, t + 0.1, 0.18, 'triangle', 0.1); },
  chime: (t) => { tone(880, t, 0.25, 'sine', 0.08); tone(1320, t + 0.08, 0.3, 'sine', 0.06); },
  coin: (t) => { tone(988, t, 0.08, 'square', 0.05); tone(1319, t + 0.08, 0.25, 'square', 0.05); },
  splash: (t) => tone(500, t, 0.25, 'sine', 0.06, 120),
  bell: (t) => { tone(196, t, 2.2, 'sine', 0.16); tone(392, t, 1.6, 'sine', 0.07); tone(587, t, 1.0, 'sine', 0.03); },
  stamp: (t) => { tone(140, t, 0.12, 'sine', 0.2, 60); tone(660, t + 0.1, 0.2, 'triangle', 0.06); },
  purr: (t) => { for (let i = 0; i < 6; i++) tone(70 + (i % 2) * 8, t + i * 0.07, 0.08, 'sawtooth', 0.025); },
  fanfare: (t) => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, t + i * 0.12, i === 5 ? 0.6 : 0.14, 'square', 0.05)),
  open: (t) => { tone(523, t, 0.08, 'triangle', 0.08); tone(784, t + 0.07, 0.14, 'triangle', 0.08); },
};

export const audio = {
  get muted() { return muted; },

  // Must be called from a user gesture (browsers block audio before one).
  init() {
    if (ctx) { ctx.resume?.(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : VOL;
    master.connect(ctx.destination);
    nextTime = ctx.currentTime + 0.1;
    musicTimer = setInterval(scheduleMusic, 200);
  },

  toggle() {
    muted = !muted;
    try { localStorage.setItem('ppt-muted', muted ? '1' : '0'); } catch { /* ignore */ }
    this.init();
    if (ctx) {
      master.gain.setTargetAtTime(muted ? 0 : VOL, ctx.currentTime, 0.05);
      nextTime = Math.max(nextTime, ctx.currentTime + 0.05);
    }
    return muted;
  },

  sfx(name) {
    if (!ctx || muted || !SFX[name]) return;
    SFX[name](ctx.currentTime + 0.01);
  },

  stop() { clearInterval(musicTimer); },
};
