import { $ } from './core.js';
import { state } from '../state.js';
import { dialogOpen, advance } from './DialogBox.js';

// On-screen D-pad and A button for phones and tablets.
export function initTouch() {
  const coarse = window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (!coarse) return;
  $('#touch').hidden = false;

  for (const btn of document.querySelectorAll('#dpad button')) {
    const dir = btn.dataset.dir;
    const on = (e) => { e.preventDefault(); state.touch[dir] = true; btn.classList.add('on'); };
    const off = (e) => { e.preventDefault(); state.touch[dir] = false; btn.classList.remove('on'); };
    btn.addEventListener('pointerdown', on);
    btn.addEventListener('pointerup', off);
    btn.addEventListener('pointerleave', off);
    btn.addEventListener('pointercancel', off);
  }

  const a = $('#btn-a');
  a.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    a.classList.add('on');
    if (dialogOpen()) advance();
    else if (!state.uiOpen) state.touchA = true;
  });
  a.addEventListener('pointerup', () => a.classList.remove('on'));
  a.addEventListener('pointerleave', () => a.classList.remove('on'));
}
