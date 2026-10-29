import Phaser from 'phaser';
import { state, uiBlocked, consumeTouchA } from '../state.js';
import { DIR_VEC } from './Walker.js';

export function createKeys(scene) {
  return scene.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,ENTER');
}

// Reads keyboard + touch into { x, y, act }. JustDown is checked every frame so presses never queue up.
export function readInput(keys) {
  const JD = Phaser.Input.Keyboard.JustDown;
  const pressed = [JD(keys.E), JD(keys.SPACE), JD(keys.ENTER)].some(Boolean);
  const touchA = consumeTouchA();
  if (uiBlocked()) return { x: 0, y: 0, act: false };
  const t = state.touch;
  const x = (keys.RIGHT.isDown || keys.D.isDown || t.right ? 1 : 0) - (keys.LEFT.isDown || keys.A.isDown || t.left ? 1 : 0);
  const y = (keys.DOWN.isDown || keys.S.isDown || t.down ? 1 : 0) - (keys.UP.isDown || keys.W.isDown || t.up ? 1 : 0);
  return { x, y, act: pressed || touchA };
}

// Finds what the player is facing: an NPC first, then any interactable whose rect holds the point in front.
// Items: { rect: {x,y,w,h}, bx?, by? }. Returns { npc } or { item } with a bubble position, or null.
export function findTarget(player, npcs, items) {
  const [dx, dy] = DIR_VEC[player.dir];
  const fx = player.x + dx * 12, fy = player.y - 4 + dy * 12;
  let best = null, bestD = 13;
  for (const n of npcs) {
    if (!n.visible) continue;
    const d = Math.hypot(n.x - fx, n.y - 4 - fy);
    if (d < bestD) { bestD = d; best = { npc: n, bx: n.x, by: n.y - 28 }; }
  }
  if (best) return best;
  for (const it of items) {
    const r = it.rect;
    if (fx >= r.x && fx <= r.x + r.w && fy >= r.y && fy <= r.y + r.h) {
      return { item: it, bx: it.bx ?? r.x + r.w / 2, by: it.by ?? r.y - 8 };
    }
  }
  return null;
}
