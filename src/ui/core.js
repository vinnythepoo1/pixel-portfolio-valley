import { state } from '../state.js';

// Tracks open UI layers so the game knows when to stop reading movement keys.
const layers = new Set();

export function openLayer(name) {
  layers.add(name);
  state.uiOpen = true;
}

export function closeLayer(name) {
  layers.delete(name);
  state.uiOpen = layers.size > 0;
  state.lastUiClose = performance.now();
}

export const $ = (sel) => document.querySelector(sel);

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// ---------------------------------------------------------------- modal
let onModalClose = null;

export function openModal(html, { onClose } = {}) {
  const modal = $('#modal');
  const card = $('#modal-card');
  card.innerHTML = `<button class="modal-x" data-close aria-label="Close">✕</button>${html}`;
  card.scrollTop = 0;
  modal.hidden = false;
  openLayer('modal');
  onModalClose = onClose || null;
  card.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeModal));
  card.querySelector('.btn, a')?.focus({ preventScroll: true });
  return card;
}

export function closeModal() {
  const modal = $('#modal');
  if (modal.hidden) return;
  modal.hidden = true;
  closeLayer('modal');
  const cb = onModalClose;
  onModalClose = null;
  cb?.();
}

export const isModalOpen = () => !$('#modal').hidden;

export function initModal() {
  $('#modal').addEventListener('pointerdown', (e) => { if (e.target.id === 'modal') closeModal(); });
}

// ---------------------------------------------------------------- toasts / banner / tooltip
export function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast box';
  el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

let bannerTimer = null;
export function showBanner(title, sub = '') {
  $('#banner-title').textContent = title;
  $('#banner-sub').textContent = sub;
  const el = $('#banner');
  el.classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

export function showTooltip(info) {
  const el = $('#tooltip');
  if (!info) { el.hidden = true; return; }
  el.innerHTML = `${esc(info.title)}<br><small>${esc(info.sub)}</small>`;
  el.style.left = `${info.x}px`;
  el.style.top = `${info.y}px`;
  el.hidden = false;
}

export function confetti() {
  const box = $('#confetti');
  const colors = ['#ffd75e', '#e8506a', '#4f97cf', '#7cc062', '#b9a6f2', '#e39a4b'];
  for (let i = 0; i < 120; i++) {
    const p = document.createElement('i');
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = `${2.2 + Math.random() * 2.2}s`;
    p.style.animationDelay = `${Math.random() * 0.8}s`;
    box.appendChild(p);
    setTimeout(() => p.remove(), 5500);
  }
}
