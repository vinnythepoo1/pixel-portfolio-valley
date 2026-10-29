import { $, openLayer, closeLayer } from './core.js';
import { audio } from '../systems/Audio.js';

// Stardew-style talk box: typewriter text, optional portrait, advance with E / Space / Enter / click.
let queue = [];
let full = '';
let typing = false;
let timer = null;
let onDone = null;

export function say(lines, { name = '', portrait = '', onDone: done } = {}) {
  queue = Array.isArray(lines) ? [...lines] : [lines];
  onDone = done || null;
  $('#dialog-name').textContent = name;
  const img = $('#dialog-portrait');
  if (portrait) img.src = portrait; else img.removeAttribute('src');
  $('#dialog').hidden = false;
  openLayer('dialog');
  next();
}

function next() {
  if (!queue.length) { close(); return; }
  full = queue.shift();
  const text = $('#dialog-text');
  text.textContent = '';
  typing = true;
  let i = 0;
  clearInterval(timer);
  timer = setInterval(() => {
    i++;
    text.textContent = full.slice(0, i);
    if (i % 3 === 0 && full[i - 1] !== ' ') audio.sfx('blip');
    if (i >= full.length) { typing = false; clearInterval(timer); }
  }, 22);
}

export function advance() {
  if (typing) {
    clearInterval(timer);
    typing = false;
    $('#dialog-text').textContent = full;
  } else {
    next();
  }
}

export function closeDialog() {
  queue = [];
  close();
}

function close() {
  clearInterval(timer);
  typing = false;
  $('#dialog').hidden = true;
  closeLayer('dialog');
  const cb = onDone;
  onDone = null;
  cb?.();
}

export const dialogOpen = () => !$('#dialog').hidden;

export function initDialog() {
  $('#dialog').addEventListener('click', advance);
}
