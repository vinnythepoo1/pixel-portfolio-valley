import { openModal, closeModal, esc } from './core.js';
import { PROJECTS, DISTRICTS } from '../data/projects.js';
import { ABOUT } from '../data/about.js';
import { bus } from '../state.js';
import { audio } from '../systems/Audio.js';

// Plain list of every project. Readable without playing, and doubles as fast travel.
export function openList({ onVisit } = {}) {
  audio.sfx('open');
  const groups = ['harbor', 'market', 'herbal'].map((d) => {
    const items = PROJECTS.filter((p) => p.district === d);
    return `
      <h3>${esc(DISTRICTS[d].name)} · ${esc(DISTRICTS[d].blurb)}</h3>
      <div class="cards">${items.map(card).join('')}</div>`;
  });
  const el = openModal(`
    <div class="kicker">Project board</div>
    <h2>${esc(ABOUT.name)}'s projects</h2>
    <p>${esc(ABOUT.letter[1])}</p>
    ${groups.join('')}
    <div class="actions">${ABOUT.links.map((l) => `<a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join('')}</div>
  `);
  el.querySelectorAll('[data-visit]').forEach((b) =>
    b.addEventListener('click', () => {
      closeModal();
      onVisit?.();
      bus.emit('travel', b.dataset.visit);
    }),
  );
}

function card(p) {
  return `
    <div class="card">
      <h4>${esc(p.title)}</h4>
      <div class="repo">${esc(p.repo)}</div>
      <p>${esc(p.summary)}</p>
      <div class="badges">${p.tech.map((t) => `<span class="badge">${esc(t)}</span>`).join('')}</div>
      <div class="actions">
        <a class="btn btn-small btn-primary" href="${esc(p.url)}" target="_blank" rel="noopener">GitHub ↗</a>
        <button class="btn btn-small" data-visit="${esc(p.id)}">🚶 Visit in town</button>
      </div>
    </div>`;
}

export function openAbout() {
  audio.sfx('open');
  openModal(`
    <div class="kicker">A letter in the mailbox</div>
    <h2>Dear traveler,</h2>
    <div class="letter">
      ${ABOUT.letter.map((l) => `<p>${esc(l)}</p>`).join('')}
      <p style="text-align:right">— ${esc(ABOUT.name)}</p>
    </div>
    <div class="actions">
      ${ABOUT.links.map((l) => `<a class="btn btn-primary" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join('')}
      <button class="btn" data-close>Close</button>
    </div>
  `);
}
