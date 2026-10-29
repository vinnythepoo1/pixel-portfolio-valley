import { $, initModal, isModalOpen, closeModal, openModal, toast, showBanner, showTooltip, confetti } from './core.js';
import { initDialog, dialogOpen, advance, closeDialog, say } from './DialogBox.js';
import { openJournal } from './Journal.js';
import { openList } from './ListOverlay.js';
import { initTouch } from './Touch.js';
import { state, bus } from '../state.js';
import { audio } from '../systems/Audio.js';
import { clockText } from '../systems/DayNight.js';
import { getStamps } from '../systems/Quest.js';
import { PROJECTS, DISTRICTS } from '../data/projects.js';

// Wires up the title screen, HUD buttons, keyboard shortcuts and bus events.
export function initUI() {
  initModal();
  initDialog();
  initTouch();

  $('#btn-start').addEventListener('click', startGame);
  $('#btn-skip').addEventListener('click', () => openList({ onVisit: startGame }));
  $('#btn-journal').addEventListener('click', openJournal);
  $('#btn-list').addEventListener('click', () => openList());
  $('#btn-sound').addEventListener('click', toggleSound);
  $('#btn-help').addEventListener('click', openHelp);
  updateSoundIcon();
  updateStamps();

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (!state.started) {
      if (k === 'enter' && !isModalOpen() && document.activeElement?.id !== 'btn-skip') { e.preventDefault(); startGame(); }
      else if (k === 'escape') closeModal();
      return;
    }
    if (dialogOpen()) {
      if (k === 'e' || k === ' ' || k === 'enter') { e.preventDefault(); advance(); }
      else if (k === 'escape') closeDialog();
      return;
    }
    if (isModalOpen()) {
      if (k === 'escape' || k === 'e') { e.preventDefault(); closeModal(); }
      return;
    }
    if (k === 'j') openJournal();
    else if (k === 'p') openList();
    else if (k === 'm') toggleSound();
  });

  setInterval(() => { $('#hud-clock').textContent = clockText(); }, 500);

  bus.on('district', (d) => {
    $('#hud-place').textContent = DISTRICTS[d].name;
    showBanner(DISTRICTS[d].name, DISTRICTS[d].blurb);
  });
  bus.on('banner', ({ title, sub }) => {
    $('#hud-place').textContent = title;
    showBanner(title, sub);
  });
  bus.on('toast', toast);
  bus.on('hover', showTooltip);
  bus.on('stamp', ({ isNew, count, total, title }) => {
    updateStamps();
    if (!isNew) return;
    audio.sfx('stamp');
    toast(`📜 New stamp: ${title} (${count}/${total})`);
    if (count === total) {
      setTimeout(() => {
        audio.sfx('fanfare');
        confetti();
        say(['You collected every stamp in the Explorer\'s Journal!', 'Thanks for visiting the whole town. Every building is a real project on GitHub, so feel free to dig into the code.'], { name: 'Explorer\'s Journal' });
      }, 900);
    }
  });
}

export function startGame() {
  if (state.started) return;
  state.started = true;
  state.lastUiClose = performance.now();
  audio.init();
  $('#title').classList.add('hide');
  setTimeout(() => { $('#title').hidden = true; }, 500);
  $('#hud').hidden = false;
  if (state.district) {
    $('#hud-place').textContent = DISTRICTS[state.district].name;
    showBanner(DISTRICTS[state.district].name, DISTRICTS[state.district].blurb);
  }
  setTimeout(() => toast('💬 Tip: talk to Pip, the guide by the fountain!'), 1600);
}

function toggleSound() {
  audio.toggle();
  updateSoundIcon();
}

function updateSoundIcon() {
  $('#btn-sound').textContent = audio.muted ? '🔇' : '🔊';
}

function updateStamps() {
  $('#hud-stamps').textContent = `${getStamps().length}/${PROJECTS.length}`;
}

function openHelp() {
  openModal(`
    <div class="kicker">How to play</div>
    <h2>Controls</h2>
    <div class="keys">
      <span><kbd>WASD</kbd> <kbd>←↑→↓</kbd></span><span>Walk</span>
      <span><kbd>Click</kbd> / <kbd>Tap</kbd></span><span>Walk to a spot or a building</span>
      <span><kbd>E</kbd> <kbd>Space</kbd></span><span>Talk, read, open doors</span>
      <span><kbd>J</kbd></span><span>Explorer's Journal</span>
      <span><kbd>P</kbd></span><span>Project list</span>
      <span><kbd>M</kbd></span><span>Sound on/off</span>
      <span><kbd>Esc</kbd></span><span>Close windows</span>
    </div>
    <p>Walk into a doorway to enter a building. Inside, look for the glowing <strong>!</strong> to read about the project.</p>
    <div class="actions"><button class="btn btn-primary" data-close>Got it</button></div>
  `);
}
