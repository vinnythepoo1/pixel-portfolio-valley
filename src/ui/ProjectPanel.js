import { openModal, esc } from './core.js';
import { DISTRICTS } from '../data/projects.js';
import { audio } from '../systems/Audio.js';

// The "signboard" inside each building: what the project is, what it found, and a link to the code.
export function openProjectPanel(p) {
  audio.sfx('open');
  openModal(`
    <div class="kicker">${esc(DISTRICTS[p.district].name)} · ${esc(p.title)}</div>
    <h2>${esc(p.repo)}</h2>
    <p>${esc(p.summary)}</p>
    <h3>Key findings</h3>
    <ul class="stats">${p.stats.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
    <div class="badges">${p.tech.map((t) => `<span class="badge">${esc(t)}</span>`).join('')}</div>
    <div class="actions">
      <a class="btn btn-primary" href="${esc(p.url)}" target="_blank" rel="noopener">Open on GitHub ↗</a>
      <button class="btn" data-close>Back to the town</button>
    </div>
  `);
}
