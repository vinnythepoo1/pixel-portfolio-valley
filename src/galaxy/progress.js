import { bus } from '../state.js';
import { ACHIEVEMENTS } from './data.js';

// Saved progress: crystals ("<id>:<n>"), planets landed on, probe logs read, achievements, stardust.
const KEY = 'pixel-galaxy-v1';
const empty = () => ({ crystal: [], planet: [], log: [], ach: [], dust: 0 });
let data = empty();
try { data = { ...empty(), ...JSON.parse(localStorage.getItem(KEY)) }; } catch { /* storage blocked */ }

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

export const progress = {
  has: (kind, id) => data[kind].includes(id),
  count: (kind, prefix = '') => data[kind].filter((x) => x.startsWith(prefix)).length,
  get dust() { return data.dust; },

  // Returns true the first time something is added.
  add(kind, id) {
    if (data[kind].includes(id)) return false;
    data[kind].push(id);
    save();
    bus.emit('progress');
    return true;
  },

  addDust(n) {
    data.dust += n;
    save();
    bus.emit('progress');
    if (data.dust >= 100) unlock('miner');
  },

  reset() { data = empty(); save(); bus.emit('progress'); },
};

export function unlock(id) {
  if (!progress.add('ach', id)) return;
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (a) bus.emit('achievement', a);
}
