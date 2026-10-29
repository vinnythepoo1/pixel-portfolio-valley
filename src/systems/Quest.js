import { PROJECTS } from '../data/projects.js';

// Explorer's Journal: one stamp per building visited, remembered in localStorage when available.
const KEY = 'ppt-journal-v1';
let memory = [];

export function getStamps() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved)) memory = saved.filter((id) => PROJECTS.some((p) => p.id === id));
  } catch { /* storage blocked: keep the in-memory copy */ }
  return memory;
}

export function addStamp(id) {
  const stamps = getStamps();
  if (stamps.includes(id)) return { isNew: false, count: stamps.length, total: PROJECTS.length };
  memory = [...stamps, id];
  try { localStorage.setItem(KEY, JSON.stringify(memory)); } catch { /* ignore */ }
  return { isNew: true, count: memory.length, total: PROJECTS.length };
}
