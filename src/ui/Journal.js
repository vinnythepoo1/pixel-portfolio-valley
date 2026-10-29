import { openModal, esc } from './core.js';
import { PROJECTS, DISTRICTS, GITHUB_URL } from '../data/projects.js';
import { getStamps } from '../systems/Quest.js';
import { audio } from '../systems/Audio.js';

export function openJournal() {
  audio.sfx('open');
  const stamps = getStamps();
  const done = stamps.length === PROJECTS.length;
  openModal(`
    <div class="kicker">Explorer's Journal</div>
    <h2>${stamps.length} / ${PROJECTS.length} buildings visited</h2>
    <div class="progress"><div style="width:${(stamps.length / PROJECTS.length) * 100}%"></div></div>
    <p>${done
      ? 'Every stamp collected. You have seen the whole town. Thanks for visiting!'
      : 'Walk into a building to collect its stamp.'}</p>
    <div class="stamps">
      ${PROJECTS.map((p) => {
        const got = stamps.includes(p.id);
        return `<div class="stamp ${got ? 'got' : 'locked'}">
          <strong>${got ? esc(p.title) : '???'}</strong>
          <small>${esc(DISTRICTS[p.district].name)}</small>
          ${got ? '<span class="seal">✓</span>' : ''}
        </div>`;
      }).join('')}
    </div>
    <div class="actions">
      <a class="btn ${done ? 'btn-primary' : ''}" href="${GITHUB_URL}" target="_blank" rel="noopener">Visit the GitHub profile ↗</a>
      <button class="btn" data-close>Close</button>
    </div>
  `);
}
