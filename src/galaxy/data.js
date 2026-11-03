// Galaxy layout and per-planet looks. Project text itself lives in src/data/projects.js.

export const WORLD = { w: 4800, h: 3800 };
export const STATION = { x: 2400, y: 1750 };
export const GATE = { x: 2820, y: 1960 };

// One star system per project group (keys match `district` in projects.js).
export const SYSTEMS = {
  harbor: { name: 'Python & ML System', blurb: 'Machine learning & analysis', x: 1250, y: 1150, sun: '#ffb347', color: '#b9a6ff' },
  market: { name: 'Dashboard System', blurb: 'BI tools & SQL', x: 3550, y: 1150, sun: '#7fe0ff', color: '#7fe0d0' },
  herbal: { name: 'Brand Story System', blurb: 'Brand case studies', x: 2400, y: 2900, sun: '#ff8fb8', color: '#ffb3c8' },
};

// look.type: bands | craters | ice | terra | crystal. c = [base, light, dark, accent]
// surface: the side-scrolling world you land on.
export const PLANETS = {
  shopee: {
    orbit: 240, start: 0.4, speed: 0.022, size: 60, look: { type: 'bands', c: ['#ff8fb8', '#ffd1e0', '#c8507f', '#ffe27a'] },
    surface: { name: 'Apotheka', sky: ['#ffd6e6', '#ff8fb8'], far: '#e87aa4', mid: '#c8507f', ground: '#9a3a64', top: '#ffb3cf', props: ['potion', 'mushroom', 'flower'], weather: 'bubbles', gravity: 480, alien: '#9fe0a0' },
  },
  dataco: {
    orbit: 340, start: 2.1, speed: 0.017, size: 64, ring: true, look: { type: 'craters', c: ['#e8a25a', '#f6cf8a', '#a8642f', '#fff0c0'] },
    surface: { name: 'Cargo Dune', sky: ['#ffe2b0', '#e8874a'], far: '#d08048', mid: '#a8642f', ground: '#7e4820', top: '#e8b070', props: ['crate', 'rock', 'cactus'], weather: 'sand', gravity: 560, alien: '#c0e070' },
  },
  'olist-delivery': {
    orbit: 440, start: 4.0, speed: 0.014, size: 58, look: { type: 'ice', c: ['#9fd8ff', '#eef8ff', '#4f86c8', '#ffffff'] },
    surface: { name: 'Parcelia', sky: ['#e2f2ff', '#8fbcec'], far: '#b0cce8', mid: '#7fa0c8', ground: '#56739f', top: '#f2f8ff', props: ['mailbox', 'parcel', 'pine'], weather: 'snow', gravity: 500, alien: '#a0d8ff' },
  },
  'olist-ecommerce': {
    orbit: 540, start: 5.4, speed: 0.012, size: 70, look: { type: 'terra', c: ['#ffd75e', '#7cc062', '#c48a2a', '#4f97cf'] },
    surface: { name: 'Bazaar Prime', sky: ['#fff0c0', '#ffb347'], far: '#e0a848', mid: '#b07a2a', ground: '#7a5220', top: '#ffd75e', props: ['stall', 'coinpile', 'palm'], weather: 'coins', gravity: 520, alien: '#ffb08a' },
  },
  'hr-attrition': {
    orbit: 640, start: 1.2, speed: 0.01, size: 62, look: { type: 'terra', c: ['#7cc062', '#d9e8c0', '#3f7a3a', '#4f97cf'] },
    surface: { name: 'Guildheim', sky: ['#d0e8ff', '#7fb0e0'], far: '#7a96a8', mid: '#4f7a5a', ground: '#3a5636', top: '#7cc062', props: ['banner', 'pine', 'rock'], weather: 'leaves', gravity: 540, alien: '#d0b0ff' },
  },
  tableau: {
    orbit: 250, start: 3.3, speed: 0.02, size: 62, ring: true, look: { type: 'bands', c: ['#ff9a5a', '#ffe0b0', '#b8502a', '#ffd75e'] },
    surface: { name: 'Hearth', sky: ['#ffb380', '#6a3a6a'], far: '#8a4a62', mid: '#6a3a4e', ground: '#4a2a3a', top: '#d07a48', props: ['lantern', 'house', 'pine'], weather: 'fireflies', gravity: 500, alien: '#ffd0a0' },
  },
  gsheet: {
    orbit: 370, start: 0.9, speed: 0.016, size: 58, look: { type: 'terra', c: ['#8fd18a', '#f2f8e0', '#4f8a3a', '#5fb0e0'] },
    surface: { name: 'Pedalia', sky: ['#e0f6ff', '#8fd0ff'], far: '#94d0a8', mid: '#5fae6a', ground: '#457f36', top: '#9fe07a', props: ['bike', 'flower', 'tree'], weather: 'wind', gravity: 500, alien: '#ffe080' },
  },
  sql: {
    orbit: 490, start: 5.0, speed: 0.013, size: 66, ring: true, look: { type: 'crystal', c: ['#9f7cff', '#e0d4ff', '#4a3270', '#7fe0ff'] },
    surface: { name: 'Arcana', sky: ['#5a3f88', '#140e34'], far: '#3f2d6a', mid: '#2e2050', ground: '#22183e', top: '#9f7cff', props: ['crystal', 'book', 'obelisk'], weather: 'sparkles', gravity: 420, alien: '#7fe0ff' },
  },
  ivish: {
    orbit: 270, start: 2.6, speed: 0.019, size: 62, look: { type: 'terra', c: ['#5fae4c', '#ffd1e0', '#2f6a3a', '#3fa0a0'] },
    surface: { name: 'Verdant', sky: ['#d6f6dc', '#5fae8a'], far: '#4a9a66', mid: '#2f6a3a', ground: '#24502c', top: '#7cc062', props: ['flower', 'fern', 'tree'], weather: 'pollen', gravity: 480, alien: '#ffb3c8' },
  },
  thepthai: {
    orbit: 420, start: 5.6, speed: 0.014, size: 60, ring: true, look: { type: 'bands', c: ['#3fb0a0', '#d0f0e0', '#1f6a60', '#ffe27a'] },
    surface: { name: 'Mortara', sky: ['#b8eadc', '#3f8a7a'], far: '#2f7a6a', mid: '#1f5a50', ground: '#163f3a', top: '#5fd0b0', props: ['herb', 'mortar', 'mushroom'], weather: 'mist', gravity: 500, alien: '#e0ff9a' },
  },
};

// Floating probes with short logs. Reading all of them earns an achievement.
export const PROBES = [
  { x: 1900, y: 1500, text: 'Log 01: Rule one of data: look at the raw rows before you trust any chart.' },
  { x: 3000, y: 1500, text: 'Log 02: Correlation detected. Causation not confirmed. Proceed with caution, pilot.' },
  { x: 2050, y: 2300, text: 'Log 03: This whole galaxy is drawn in code. No image files were harmed.' },
  { x: 2900, y: 2450, text: 'Log 04: Data leakage spotted near Bazaar Prime... they fixed it. An honest F1 beats a fake one.' },
  { x: 700, y: 2300, text: 'Log 05: A pivot table a day keeps the chaos away.' },
  { x: 4300, y: 2300, text: 'Log 06: The pilot of this ship is open to new missions. Dock at the station and read the Captain\'s Log.' },
];

// Asteroid fields as rectangles; asteroids drift inside them.
export const BELTS = [
  { x: 1950, y: 650, w: 900, h: 300, n: 18 },
  { x: 1500, y: 2150, w: 600, h: 450, n: 16 },
  { x: 3050, y: 2100, w: 700, h: 450, n: 16 },
  { x: 300, y: 2600, w: 700, h: 600, n: 12 },
  { x: 3900, y: 2500, w: 650, h: 650, n: 12 },
];

export const ACHIEVEMENTS = [
  { id: 'launch', icon: '🚀', name: 'Liftoff', desc: 'Start your first flight.' },
  { id: 'station', icon: '🛰', name: 'Docked', desc: 'Visit the space station.' },
  { id: 'landing', icon: '🪐', name: 'Touchdown', desc: 'Land on a planet.' },
  { id: 'harvest', icon: '💎', name: 'Data Harvester', desc: 'Collect every crystal on one planet.' },
  { id: 'tour', icon: '🗺', name: 'Grand Tour', desc: 'Land on all 10 planets.' },
  { id: 'all', icon: '🌟', name: 'Galactic Analyst', desc: 'Collect all 40 data crystals.' },
  { id: 'miner', icon: '⛏', name: 'Asteroid Miner', desc: 'Collect 100 stardust.' },
  { id: 'whale', icon: '🐋', name: 'Whale Whisperer', desc: 'Talk to the space whale.' },
  { id: 'archivist', icon: '📡', name: 'Archivist', desc: 'Read all 6 probe logs.' },
  { id: 'signal', icon: '📶', name: 'Signal Sent', desc: 'Open a project on GitHub from a beacon.' },
];

export const WHALE_LINES = [
  ['Hrrrooooom...', 'I have swum between these planets for a thousand cycles, little pilot.', 'Every planet here holds four data crystals. Collect them all and the stars themselves will celebrate.'],
  ['Hrrooom. The Archive planet hums with SQL spells. The Guild planet worries about who will leave.', 'Visit them all.'],
  ['...', 'The whale blows a ring of stardust at you. It seems happy.'],
];
