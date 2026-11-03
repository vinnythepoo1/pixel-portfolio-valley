import { $, esc, openModal, closeModal, isModalOpen, initModal, toast, showBanner, confetti } from '../ui/core.js';
import { initDialog, dialogOpen, advance, closeDialog } from '../ui/DialogBox.js';
import { initTouch } from '../ui/Touch.js';
import { state, bus } from '../state.js';
import { audio } from '../systems/Audio.js';
import { PROJECTS, SKY, GITHUB_URL, byId } from '../data/projects.js';
import { ABOUT } from '../data/about.js';
import { SYSTEMS, PLANETS, ACHIEVEMENTS, WORLD, STATION, GATE } from './data.js';
import { progress, unlock } from './progress.js';
import { renderChart } from './chartView.js';

const TOTAL_CRYSTALS = PROJECTS.length * 4;
const badges = (p) => p.tech.map((t) => `<span class="badge">${esc(t)}</span>`).join('');
const planetName = (p) => PLANETS[p.id].surface.name;

// What each of a planet's 4 crystals holds: the chart first, then three findings.
export function crystalContent(p, n) {
  if (n === 0) return { kind: 'chart', title: SKY[p.id].chart.title };
  const facts = [...Object.values(p.facts), ...p.stats];
  return { kind: 'fact', text: facts[n - 1] };
}

// ------------------------------------------------------------------ setup
export function initHud() {
  initModal();
  initDialog();
  initTouch();

  const b = $('#btn-b');
  if (b) {
    const on = (e) => { e.preventDefault(); state.touchB = true; b.classList.add('on'); };
    const off = () => { state.touchB = false; b.classList.remove('on'); };
    b.addEventListener('pointerdown', on);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, off));
  }

  $('#btn-start').addEventListener('click', startGame);
  $('#btn-skip').addEventListener('click', () => openMissionBoard());
  $('#btn-missions').addEventListener('click', () => openMissionBoard());
  $('#btn-log').addEventListener('click', openLogbook);
  $('#btn-sound').addEventListener('click', toggleSound);
  $('#btn-help').addEventListener('click', openHelp);
  $('#btn-orbit').addEventListener('click', () => bus.emit('leavePlanet'));
  updateSoundIcon();
  updateCounters();

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
      if (k === 'escape') { e.preventDefault(); closeModal(); }
      return;
    }
    if (k === 'l') openLogbook();
    else if (k === 'p' || k === 'tab') { e.preventDefault(); openMissionBoard(); }
    else if (k === 'm') toggleSound();
  });

  bus.on('progress', updateCounters);
  bus.on('banner', ({ title, sub }) => showBanner(title, sub));
  bus.on('toast', toast);
  bus.on('achievement', (a) => {
    audio.sfx('fanfare');
    toast(`🏆 Achievement unlocked: ${a.icon} ${a.name}`);
  });
  bus.on('target', setTarget);
  bus.on('mode', (mode) => {
    $('#btn-orbit').hidden = mode !== 'planet';
    $('#minimap').hidden = mode === 'planet';
    $('#energy').hidden = mode === 'planet';
  });
  bus.on('energy', (v) => { $('#energy > div').style.width = `${Math.round(v * 100)}%`; });
}

export function startGame() {
  if (state.started) return;
  state.started = true;
  state.lastUiClose = performance.now();
  audio.init();
  $('#title').classList.add('hide');
  setTimeout(() => { $('#title').hidden = true; }, 500);
  $('#hud').hidden = false;
  $('#minimap').hidden = false;
  $('#energy').hidden = false;
  unlock('launch');
  setTimeout(() => toast('🚀 Fly with WASD / arrows · Space shoots · Shift boosts · E lands'), 900);
  setTimeout(() => toast('🛰 Tip: dock at the space station first. It has a mission board with autopilot!'), 5200);
}

function toggleSound() { audio.toggle(); updateSoundIcon(); }
function updateSoundIcon() { $('#btn-sound').textContent = audio.muted ? '🔇' : '🔊'; }

export function updateCounters() {
  $('#c-crystals').textContent = `${progress.count('crystal')}/${TOTAL_CRYSTALS}`;
  $('#c-planets').textContent = `${progress.count('planet')}/${PROJECTS.length}`;
  $('#c-dust').textContent = progress.dust;
}

function setTarget(info) {
  const el = $('#target');
  if (!info) { el.hidden = true; return; }
  el.innerHTML = `<span class="key">E</span> ${esc(info.action)} <strong>${esc(info.name)}</strong>${info.sub ? `<small>${esc(info.sub)}</small>` : ''}`;
  el.hidden = false;
}

// ------------------------------------------------------------------ minimap
export function drawMinimap(view) {
  const c = $('#minimap');
  if (c.hidden) return;
  const g = c.getContext('2d');
  const W = c.width, H = c.height, sx = W / WORLD.w, sy = H / WORLD.h;
  g.clearRect(0, 0, W, H);
  g.fillStyle = 'rgba(8,6,30,0.85)';
  g.fillRect(0, 0, W, H);
  for (const [k, s] of Object.entries(SYSTEMS)) {
    g.fillStyle = s.sun;
    g.fillRect(s.x * sx - 3, s.y * sy - 3, 6, 6);
    g.strokeStyle = `${s.color}33`;
    g.beginPath(); g.arc(s.x * sx, s.y * sy, 30, 0, Math.PI * 2); g.stroke();
    void k;
  }
  for (const pl of view.planets) {
    const done = progress.count('crystal', `${pl.p.id}:`) === 4;
    g.fillStyle = done ? '#ffd75e' : progress.has('planet', pl.p.id) ? '#ffffff' : SYSTEMS[pl.p.district].color;
    g.fillRect(pl.x * sx - 2, pl.y * sy - 2, 4, 4);
    if (view.course === pl.p.id) { g.strokeStyle = '#ffd75e'; g.strokeRect(pl.x * sx - 4, pl.y * sy - 4, 8, 8); }
  }
  g.fillStyle = '#dfe3ee'; g.fillRect(STATION.x * sx - 3, STATION.y * sy - 2, 6, 4);
  g.fillStyle = '#9f7cff'; g.fillRect(GATE.x * sx - 2, GATE.y * sy - 2, 4, 4);
  const t = performance.now() / 300;
  g.fillStyle = Math.sin(t) > 0 ? '#ff6a4a' : '#ffd75e';
  g.fillRect(view.ship.x * sx - 2, view.ship.y * sy - 2, 5, 5);
  const v = view.cam;
  g.strokeStyle = 'rgba(255,255,255,0.35)';
  g.strokeRect(v.x * sx, v.y * sy, v.width * sx, v.height * sy);
}

// ------------------------------------------------------------------ windows
export function openStation() {
  audio.sfx('open');
  unlock('station');
  const card = openModal(`
    <div class="kicker">🛰 Home Station · docking bay</div>
    <h2>Welcome aboard, pilot</h2>
    <p>This galaxy is ${esc(ABOUT.name)}'s portfolio. Every planet is a real project. Land on them to collect data crystals and read the findings.</p>
    <div class="menu">
      <button class="btn btn-primary" data-go="about">📜 Captain's Log <small>About ${esc(ABOUT.name)}</small></button>
      <button class="btn" data-go="missions">🗺 Mission Board <small>All projects · autopilot</small></button>
      <button class="btn" data-go="log">🏆 Logbook <small>Progress & achievements</small></button>
      <a class="btn" href="town.html">🏘 Warp to the old pixel town <small>The first version of this site</small></a>
    </div>`);
  card.querySelector('[data-go=about]').onclick = openAbout;
  card.querySelector('[data-go=missions]').onclick = () => openMissionBoard();
  card.querySelector('[data-go=log]').onclick = openLogbook;
}

export function openAbout() {
  openModal(`
    <div class="kicker">📜 Captain's Log</div>
    <h2>${esc(ABOUT.name)}</h2>
    <div class="letter">${ABOUT.letter.map((l) => `<p>${esc(l)}</p>`).join('')}</div>
    <div class="actions">${ABOUT.links.map((l) => `<a class="btn btn-primary" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join('')}
      <button class="btn" data-close>Close</button></div>`);
}

export function openMissionBoard() {
  audio.sfx('open');
  const groups = Object.entries(SYSTEMS).map(([d, sys]) => {
    const cards = PROJECTS.filter((p) => p.district === d).map((p) => {
      const got = progress.count('crystal', `${p.id}:`);
      return `
      <div class="card">
        <div class="card-top"><h4>${esc(SKY[p.id].name)}</h4><span class="pill">💎 ${got}/4</span></div>
        <div class="repo">Planet ${esc(planetName(p))} · ${esc(p.repo)}</div>
        <p>${esc(p.summary)}</p>
        <div class="badges">${badges(p)}</div>
        <div class="actions">
          <a class="btn btn-small btn-primary" href="${esc(p.url)}" target="_blank" rel="noopener">GitHub ↗</a>
          <button class="btn btn-small" data-course="${esc(p.id)}">🚀 Set course</button>
          <button class="btn btn-small" data-warp="${esc(p.id)}">⚡ Warp there</button>
        </div>
      </div>`;
    }).join('');
    return `<h3 style="color:${sys.color}">✦ ${esc(sys.name)} <small>${esc(sys.blurb)}</small></h3><div class="cards">${cards}</div>`;
  }).join('');
  const card = openModal(`
    <div class="kicker">🗺 Mission Board</div>
    <h2>${esc(ABOUT.name)}'s projects</h2>
    <p>Every project in plain text. <strong>Set course</strong> turns on autopilot, and <strong>Warp</strong> takes you straight there.</p>
    ${groups}`);
  card.querySelectorAll('[data-course]').forEach((btn) => btn.addEventListener('click', () => go('course', btn.dataset.course)));
  card.querySelectorAll('[data-warp]').forEach((btn) => btn.addEventListener('click', () => go('warp', btn.dataset.warp)));
}

function go(kind, id) {
  closeModal();
  if (!state.started) startGame();
  bus.emit(kind, id);
}

export function openLogbook() {
  audio.sfx('open');
  const c = progress.count('crystal');
  openModal(`
    <div class="kicker">🏆 Logbook</div>
    <h2>${c} / ${TOTAL_CRYSTALS} data crystals</h2>
    <div class="progress"><div style="width:${(c / TOTAL_CRYSTALS) * 100}%"></div></div>
    <p>Planets landed on: ${progress.count('planet')}/${PROJECTS.length} · Stardust: ${progress.dust} · Probe logs: ${progress.count('log')}/6</p>
    <h3>Planets</h3>
    <div class="grid">${PROJECTS.map((p) => {
      const n = progress.count('crystal', `${p.id}:`);
      return `<div class="tile ${n === 4 ? 'done' : ''}"><strong>${progress.has('planet', p.id) ? esc(planetName(p)) : '???'}</strong><small>${'💎'.repeat(n)}${'◇'.repeat(4 - n)}</small></div>`;
    }).join('')}</div>
    <h3>Achievements</h3>
    <div class="grid">${ACHIEVEMENTS.map((a) => {
      const got = progress.has('ach', a.id);
      return `<div class="tile ${got ? 'done' : 'locked'}"><strong>${got ? a.icon : '🔒'} ${esc(a.name)}</strong><small>${esc(a.desc)}</small></div>`;
    }).join('')}</div>
    <div class="actions"><a class="btn" href="${GITHUB_URL}" target="_blank" rel="noopener">GitHub profile ↗</a><button class="btn" data-close>Close</button></div>`);
}

export function openHelp() {
  openModal(`
    <div class="kicker">How to play</div>
    <h2>Controls</h2>
    <h3>In space</h3>
    <div class="keys">
      <span><kbd>WASD</kbd> <kbd>←↑→↓</kbd></span><span>Fly</span>
      <span><kbd>Space</kbd></span><span>Shoot asteroids for stardust</span>
      <span><kbd>Shift</kbd></span><span>Boost</span>
      <span><kbd>E</kbd></span><span>Land, dock, read probes</span>
    </div>
    <h3>On a planet</h3>
    <div class="keys">
      <span><kbd>A</kbd> <kbd>D</kbd> <kbd>←→</kbd></span><span>Walk</span>
      <span><kbd>W</kbd> <kbd>↑</kbd> <kbd>Space</kbd></span><span>Jump (press again to double jump)</span>
      <span><kbd>E</kbd></span><span>Use terminals, talk</span>
      <span><kbd>Esc</kbd></span><span>Return to orbit</span>
    </div>
    <h3>Anywhere</h3>
    <div class="keys">
      <span><kbd>P</kbd></span><span>Mission board (all projects)</span>
      <span><kbd>L</kbd></span><span>Logbook</span>
      <span><kbd>M</kbd></span><span>Sound on/off</span>
    </div>
    <div class="actions"><button class="btn btn-primary" data-close>Let's fly</button></div>`);
}

export function openBriefing(p) {
  audio.sfx('open');
  openModal(`
    <div class="kicker">🖥 Mission briefing · Planet ${esc(planetName(p))}</div>
    <h2>${esc(SKY[p.id].name)}</h2>
    <div class="repo">${esc(p.repo)}</div>
    <p>${esc(p.summary)}</p>
    <h3>Key findings</h3>
    <ul class="stats">${p.stats.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
    <p class="muted">Four data crystals are hidden on this planet. Jump up the platforms to collect them.</p>
    <div class="actions"><button class="btn btn-primary" data-close>Start exploring</button></div>`);
}

export function openCrystal(p, n) {
  const c = crystalContent(p, n);
  const got = progress.count('crystal', `${p.id}:`);
  const card = openModal(`
    <div class="kicker">💎 Data crystal ${got}/4 · ${esc(SKY[p.id].name)}</div>
    ${c.kind === 'chart'
      ? `<h2>${esc(c.title)}</h2><canvas class="chart" aria-label="${esc(c.title)}"></canvas>`
      : `<h2>Finding #${n}</h2><blockquote>${esc(c.text)}</blockquote>`}
    <div class="actions"><button class="btn btn-primary" data-close>Keep exploring</button></div>`);
  if (c.kind === 'chart') renderChart(card.querySelector('canvas'), SKY[p.id].chart, SYSTEMS[p.district].color);
}

export function openTech(p) {
  audio.sfx('open');
  openModal(`
    <div class="kicker">🗿 Toolbox monolith</div>
    <h2>Tools used on ${esc(SKY[p.id].name)}</h2>
    <div class="badges big">${badges(p)}</div>
    <p class="muted">The monolith hums. Each glowing rune is a tool from this project.</p>
    <div class="actions"><button class="btn btn-primary" data-close>Close</button></div>`);
}

export function openBeacon(p) {
  audio.sfx('open');
  const card = openModal(`
    <div class="kicker">📡 GitHub beacon</div>
    <h2>Transmit to GitHub?</h2>
    <p>The beacon can open <strong>${esc(p.repo)}</strong> on GitHub, where you'll find the full code, notebooks and README.</p>
    <div class="actions">
      <a class="btn btn-primary" data-signal href="${esc(p.url)}" target="_blank" rel="noopener">📶 Open on GitHub ↗</a>
      <button class="btn" data-close>Not now</button>
    </div>`);
  card.querySelector('[data-signal]').addEventListener('click', () => unlock('signal'));
}

export function celebrateAll() {
  audio.sfx('fanfare');
  confetti();
  openModal(`
    <div class="kicker">🌟 Mission complete</div>
    <h2>You collected all ${TOTAL_CRYSTALS} data crystals!</h2>
    <p>You've seen every project in this galaxy. Thank you for exploring!</p>
    <div class="letter">${ABOUT.letter.map((l) => `<p>${esc(l)}</p>`).join('')}</div>
    <div class="actions">${ABOUT.links.map((l) => `<a class="btn btn-primary" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join('')}
      <button class="btn" data-close>Keep flying</button></div>`);
}

export { byId };
