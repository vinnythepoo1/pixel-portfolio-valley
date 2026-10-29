// Townsfolk who walk around the town.
// area = [x, y, w, h] in tiles where they wander; home = tile where they go to sleep.
// Each entry in `lines` is one conversation; talking again moves to the next one.

export const TOWN_NPCS = [
  {
    id: 'pip',
    name: 'Pip the Guide',
    start: [29, 26],
    home: [29, 26],
    area: [26, 25, 10, 4],
    always: true,
    speed: 28,
    look: { hair: '#d9a03a', shirt: '#4f8a5b', pants: '#5b3a29', hat: '#3f6e3a', hatStyle: 'cap' },
    lines: [
      [
        "Welcome to Vinny's Pixel Town! Every building here is one of Vinny's GitHub projects.",
        'Walk with WASD or the arrow keys, or just click where you want to go. Press E or Space to talk, read and open doors.',
        'Walk into any doorway to look inside. Each building you visit adds a stamp to your Explorer\'s Journal!',
      ],
      ['Lost? The notice board by the fountain lists every project, and it can take you straight there.'],
      ['Harbor Ward is south, Market Hill is north-west, Herbal Lane is north-east. Have fun exploring!'],
      ['Collect all 10 stamps and something nice happens. Just saying!'],
    ],
  },
  {
    id: 'bram',
    name: 'Mayor Bram',
    start: [35, 21],
    home: [7, 10],
    area: [24, 19, 16, 10],
    speed: 30,
    look: { hair: '#9a9a9a', beard: '#b5b5b5', shirt: '#7a3a5a', pants: '#3b3b44', hat: '#2a1c14', hatStyle: 'tricorn' },
    lines: [
      ['Ah, a visitor! Our town grows a new building every time Vinny finishes a project.'],
      ['The Harbor Ward down south is all Python and machine learning. Market Hill up north does dashboards.'],
      ['Try the mailbox by the fountain. Vinny left a letter for visitors.'],
    ],
  },
  {
    id: 'tomas',
    name: 'Old Tomas',
    start: [9, 13],
    home: [14, 10],
    area: [3, 11, 26, 6],
    look: { hair: '#c8c8c8', shirt: '#7a8a3a', pants: '#5b3a29', hat: '#e3c26b', hatStyle: 'straw', beard: '#d0d0d0' },
    lines: [
      ['The Stable sells bikes now! Turns out most buyers are 30 to 50 years old.'],
      ['My daughter only rides two miles to work. Perfect bike distance, they say.'],
    ],
  },
  {
    id: 'lyra',
    name: 'Lyra the Apprentice',
    start: [20, 14],
    home: [23, 10],
    area: [3, 11, 26, 6],
    look: { hair: '#b9a6f2', shirt: '#5b3f8c', pants: '#3f3556', hat: '#5b3f8c', hatStyle: 'wizard', long: true },
    lines: [
      ['Master says every bookshelf in the Archive is a SQL table. I just call them very organized books.'],
      ['Did you know you can rank the companies with the most layoffs for every year with one query? Wizardry!'],
    ],
  },
  {
    id: 'fern',
    name: 'Fern the Herbalist',
    start: [43, 13],
    home: [39, 10],
    area: [34, 11, 18, 6],
    look: { hair: '#5a8a3a', shirt: '#e9d7a8', pants: '#5b3a29', dress: '#5f9a4a', long: true, hat: '#ffe27a', hatStyle: 'flower' },
    lines: [
      ['The Greenhouse tells the story of IVISN, an herbal oral-care brand that dates back to 1921!'],
      ['Herbs, history and a good SWOT analysis. That\'s Herbal Lane for you.'],
    ],
  },
  {
    id: 'bo',
    name: 'Bo',
    start: [50, 12],
    home: [47, 10],
    area: [34, 11, 26, 6],
    look: { hair: '#2a1c14', shirt: '#3d7f74', pants: '#3b3b5c', skin: '#d9a57a', hat: '#c0453a', hatStyle: 'bandana' },
    lines: [
      ['At the Workshop they swear by the "green bean size" rule. Just a tiny bit of toothpaste!'],
      ['The Workshop\'s recipe comes all the way from Songkhla.'],
    ],
  },
  {
    id: 'mara',
    name: 'Captain Mara',
    start: [27, 38],
    home: [21, 36],
    area: [3, 37, 58, 4],
    look: { hair: '#7a3a22', shirt: '#f1e6c8', pants: '#3f5fa8', hat: '#2a1c14', hatStyle: 'tricorn', long: true },
    lines: [
      ["The Courier's Roost lost about R$1.15 million to late parcels. And late parcels got far worse reviews."],
      ['Only about 3 in 100 customers ever ordered a second time. Ouch.'],
    ],
  },
  {
    id: 'kip',
    name: 'Kip the Dockhand',
    start: [10, 38],
    home: [14, 36],
    area: [3, 37, 30, 4],
    look: { hair: '#3a2a1e', shirt: '#c0453a', pants: '#3b3b5c', hat: '#3f6ea8', hatStyle: 'bandana', skin: '#c98d5e' },
    lines: [
      ['54.8% of caravans arrive late! And First Class? Late 95.3% of the time. Ironic, right?'],
      ['The Caravan Depot has a model that predicts late deliveries. Pretty clever stuff.'],
    ],
  },
  {
    id: 'sasha',
    name: 'Sasha the Recruit',
    start: [45, 38],
    home: [49, 36],
    area: [34, 37, 27, 4],
    look: { hair: '#d9a03a', shirt: '#a0413a', pants: '#3b3b44', long: true },
    lines: [
      ["The Guild keeps records on 1,470 adventurers. 16.1% of them have left!"],
      ['The Guildmaster built a model to spot who might quit. I\'m staying, promise!'],
    ],
  },
  {
    id: 'ollie',
    name: 'Ollie the Lamplighter',
    start: [40, 28],
    home: [40, 28],
    area: [23, 13, 18, 24],
    night: true,
    speed: 26,
    look: { hair: '#5a3a22', shirt: '#3b3b5c', pants: '#2a1c14', hat: '#4a3a5a', hatStyle: 'hood' },
    lines: [
      ['Shh... most folks are asleep. I keep the lanterns lit so travelers can find their way.'],
      ['Night is a lovely time to visit. See how the windows glow?'],
    ],
  },
];
