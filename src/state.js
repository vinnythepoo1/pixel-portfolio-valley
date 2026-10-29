import Phaser from 'phaser';

// One event bus shared by scenes and the DOM UI.
export const bus = new Phaser.Events.EventEmitter();

export const state = {
  started: false,
  uiOpen: false,
  lastUiClose: 0,
  minutes: 9 * 60, // in-game clock, starts at 09:00
  day: 1,
  weather: 'clear',
  district: null,
  touch: { up: false, down: false, left: false, right: false },
  touchA: false,
};

// True while the title screen, a dialog or a modal has the player's attention.
export function uiBlocked() {
  return !state.started || state.uiOpen || performance.now() - state.lastUiClose < 200;
}

export function consumeTouchA() {
  const a = state.touchA;
  state.touchA = false;
  return a;
}

// Camera zoom so roughly 270 world pixels fit vertically (or 320 horizontally on narrow screens).
export function baseZoom(w, h) {
  return Math.max(1, Math.min(h / 270, w / 320));
}
