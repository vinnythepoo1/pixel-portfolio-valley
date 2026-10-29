// The one place to edit project content.
// To add a project: add an entry here, give it a free spot on the map (building.x / building.y in tiles),
// and either reuse an existing `interior` key or write a new builder in src/interiors/.

export const GITHUB_USER = 'Vinnythepoo1';
export const GITHUB_URL = `https://github.com/${GITHUB_USER}`;
const repoUrl = (name) => `${GITHUB_URL}/${name}`;

export const DISTRICTS = {
  plaza: { name: 'Town Plaza', blurb: 'The heart of town' },
  market: { name: 'Market Hill', blurb: 'Dashboards & BI tools' },
  herbal: { name: 'Herbal Lane', blurb: 'Brand case studies' },
  harbor: { name: 'Harbor Ward', blurb: 'Python & machine learning' },
};

export const PROJECTS = [
  // ------------------------------------------------------------ Harbor Ward
  {
    id: 'shopee',
    repo: 'shopee-health-wellness-analysis',
    title: 'The Apothecary',
    district: 'harbor',
    interior: 'apothecary',
    summary:
      'Analysis of Shopee health & wellness listings: cleaning the scraped data, comparing sales across product categories, and modelling sales with a Random Forest. Results are presented in a Power BI dashboard.',
    stats: ['68,499 scraped listings cleaned down to 2,622', 'Top category: Skin Nourishment, ฿36.6M in sales', 'Random Forest sales model, R² 0.372'],
    tech: ['Python', 'pandas', 'scikit-learn', 'Power BI', 'Jupyter'],
    facts: {
      shelf: 'Potion shelves, sorted by category. The best seller? Skin Nourishment, with ฿36.6M in sales.',
      board: 'A ledger on the wall: 68,499 listings were scraped, and 2,622 survived the cleaning.',
      cauldron: 'A Random Forest bubbles away inside. It explains about 37% of sales (R² 0.372). Predicting sales is tricky magic!',
    },
    building: { x: 4, y: 32, w: 5, h: 4, door: 2, style: { wall: '#ecdcb4', trim: '#6b4a2f', roof: '#4f8a5b', sign: 'potion', chimney: true, flowers: true } },
    keeper: {
      name: 'Wren the Apothecary',
      look: { hair: '#c0503a', shirt: '#4f8a5b', pants: '#5b3a29', apron: '#f1e6c8', long: true, dress: '#3f6e4a' },
      lines: [
        ['Welcome to the Apothecary! Every potion here is a product from Shopee\'s health & wellness shelves.', 'Have a look at the sales ledger on the counter. That\'s where the full story is.'],
        ['Skin Nourishment potions sell like crazy. ฿36.6 million worth!'],
      ],
    },
  },
  {
    id: 'dataco',
    repo: 'dataco-supply-chain-analytics',
    title: 'Caravan Depot',
    district: 'harbor',
    interior: 'caravanDepot',
    summary:
      'Supply-chain analytics on the DataCo dataset: how often orders arrive late, which shipping modes are worst, and a Random Forest model that predicts late deliveries.',
    stats: ['54.8% of orders delivered late', 'First Class shipping late 95.3% of the time', 'Late-delivery model: Random Forest, AUC 0.879'],
    tech: ['Python', 'pandas', 'scikit-learn', 'Jupyter'],
    facts: {
      hourglass: 'Rows of hourglasses, one per order. 54.8% of them ran out before the caravan arrived.',
      board: 'Shipping modes chart: First Class was late 95.3% of the time. Not very first class!',
      crates: 'A stamp on the crates reads: "Late-delivery predictor, Random Forest, AUC 0.879".',
    },
    building: { x: 11, y: 32, w: 6, h: 4, door: 3, style: { wall: '#b08354', wallKind: 'planks', trim: '#5b3a22', roof: '#7a4b2a', sign: 'crate' } },
    keeper: {
      name: 'Quartermaster Hal',
      look: { hair: '#2a1c14', beard: '#4a3020', shirt: '#8a5a32', pants: '#3b3b5c', hat: '#5b3a22', hatStyle: 'cap' },
      lines: [
        ['Caravans in, caravans out. Trouble is, more than half of them are late.', 'The map table shows the whole operation. Take a look.'],
        ['I can tell you which caravans will be late before they leave. The model\'s AUC is 0.879!'],
      ],
    },
  },
  {
    id: 'olist-delivery',
    repo: 'olist-delivery-analytics',
    title: "Courier's Roost",
    district: 'harbor',
    interior: 'courierRoost',
    summary:
      'Delivery performance on the Olist Brazilian e-commerce data: the cost of late orders, the worst states, the effect on review scores and repeat buying, plus a late-delivery model.',
    stats: ['8.19% of orders late, about R$1.15M in order value', 'Alagoas (AL) worst, 23.7% late', 'Late orders: review score 4.30 → 2.61', 'Only 2.98% of customers ordered again', 'Late-delivery model AUC 0.694'],
    tech: ['Python', 'pandas', 'scikit-learn', 'Jupyter'],
    facts: {
      map: 'Route map of Brazil. A red pin marks Alagoas (AL), where 23.7% of parcels were late.',
      reviews: 'Review chart: on-time parcels average 4.30 stars, late ones only 2.61.',
      parcels: 'A pile of late parcels: 8.19% of all orders, worth about R$1.15M.',
      owl: 'Hoo! Only 2.98% of customers ever came back for a second order. Hoo-hoo.',
    },
    building: { x: 19, y: 32, w: 5, h: 4, door: 2, style: { wall: '#e2d2b0', trim: '#5b3a22', roof: '#3f6ea8', sign: 'letter', owl: true, chimney: true } },
    keeper: {
      name: 'Courier Juno',
      look: { hair: '#3a2a1e', shirt: '#3f6ea8', pants: '#5b3a29', hat: '#3f6ea8', hatStyle: 'cap' },
      lines: [
        ['Parcels for the whole of Brazil pass through this roost!', 'The sorting desk has the full delivery report.'],
        ['Late parcels make customers grumpy. Reviews drop from 4.30 to 2.61 stars!'],
      ],
    },
  },
  {
    id: 'olist-ecommerce',
    repo: 'olist-ecommerce-analysis',
    title: 'Grand Bazaar',
    district: 'harbor',
    interior: 'bazaar',
    summary:
      'End-to-end analysis of delivered Olist orders: order trends, late-delivery rates over time, and a late-delivery model rebuilt honestly after removing data leakage.',
    stats: ['96,454 delivered orders analysed', '8.11% of orders late', 'Late rate spiked to 21.4% in March 2018', 'Honest model after removing leakage: F1 0.33'],
    tech: ['Python', 'pandas', 'scikit-learn', 'Jupyter'],
    facts: {
      stall: '96,454 orders passed through these stalls.',
      chart: 'A trend chart with one big spike: March 2018, when 21.4% of orders were late.',
      crates: 'A note on the crate: "Removed data leakage. Honest F1 is 0.33. Truth over flattery!"',
    },
    building: { x: 36, y: 32, w: 7, h: 4, door: 3, style: { type: 'tent', wall: '#d9b98a', trim: '#7a4b2a', roof: '#c4473a', sign: 'coin' } },
    keeper: {
      name: 'Merchant Sol',
      look: { hair: '#2a1c14', shirt: '#c4473a', pants: '#f1e6c8', hat: '#ffd75e', hatStyle: 'bandana', skin: '#c98d5e' },
      lines: [
        ['Welcome to the Grand Bazaar! Ninety-six thousand orders, and counting.', 'The big ledger tells you everything.'],
        ['March 2018 was chaos. More than one in five orders arrived late!'],
      ],
    },
  },
  {
    id: 'hr-attrition',
    repo: 'hr-attrition-analysis',
    title: "Adventurers' Guild",
    district: 'harbor',
    interior: 'guildHall',
    summary:
      'Employee attrition analysis: who leaves and why, explored with MySQL and a Power BI dashboard, plus a model that predicts attrition.',
    stats: ['1,470 employees analysed', '16.1% attrition rate', 'MySQL + Power BI dashboard', 'Attrition model AUC 0.808'],
    tech: ['Python', 'MySQL', 'Power BI', 'scikit-learn'],
    facts: {
      roster: 'The member roster: 1,470 adventurers. A few names have been crossed out...',
      exit: 'A sign above the door reads: "16.1% of members have left through here."',
      table: 'Guild records are kept in MySQL, and the dashboards are made in Power BI.',
      chest: 'A chest of predictions. The attrition model scores AUC 0.808.',
    },
    building: { x: 46, y: 31, w: 6, h: 5, door: 3, style: { wall: '#a39a8a', wallKind: 'stone', trim: '#4a3a2e', roof: '#a0413a', sign: 'sword', banners: '#3f5fa8' } },
    keeper: {
      name: 'Guildmaster Brann',
      look: { hair: '#9a9a9a', beard: '#b5b5b5', shirt: '#3f5fa8', pants: '#3b3b44', cape: '#a0413a' },
      lines: [
        ['Welcome, adventurer! The quest board has everything we know about our members.'],
        ['Losing 16.1% of the guild hurts. Now we can spot who might leave before they do.'],
      ],
    },
  },

  // ------------------------------------------------------------ Market Hill
  {
    id: 'tableau',
    repo: 'Tableau_Project1',
    title: 'The Cozy Inn',
    district: 'market',
    interior: 'inn',
    summary:
      'Tableau dashboards on Seattle Airbnb listings: what drives price, when revenue peaks, and which neighbourhoods charge a premium.',
    stats: ['6-bedroom listings are the priciest', 'Revenue peaks in late May and June', 'Zip code 98119 carries a price premium'],
    tech: ['Tableau'],
    facts: {
      price: 'Room prices: the more beds, the higher the price. The 6-bed rooms cost the most.',
      calendar: 'The busy-season calendar: late May and June bring in the most revenue.',
      painting: 'A painting of a Seattle hillside, labelled "98119". Rooms there cost extra.',
      beds: 'Cozy beds. More beds per room means a higher nightly price!',
    },
    building: { x: 4, y: 5, w: 6, h: 5, door: 3, style: { wall: '#f0e2c0', trim: '#6b4a2f', roof: '#c2643a', sign: 'bed', chimney: true, flowers: true } },
    keeper: {
      name: 'Innkeeper Rosa',
      look: { hair: '#7a3a22', shirt: '#c2643a', pants: '#5b3a29', apron: '#ffffff', dress: '#8a3a2a', long: true },
      lines: [
        ['Welcome to the Cozy Inn! Our guestbook is full of Seattle Airbnb stories.', 'Busy season is late May and June. Book early!'],
        ['Big rooms earn the most. Six beds, top price!'],
      ],
    },
  },
  {
    id: 'gsheet',
    repo: 'Google-Sheet_Project-1',
    title: 'Stable & Wheelwright',
    district: 'market',
    interior: 'stable',
    summary:
      'Google Sheets analysis of bike buyers: cleaning the data, building pivot tables, and a dashboard showing who buys bikes.',
    stats: ['Most buyers are aged 30–50', 'Buyers with a 0–5 mile commute buy the most', 'Pivot-table dashboard in Google Sheets'],
    tech: ['Google Sheets', 'Pivot tables'],
    facts: {
      bikes: 'Bikes for sale. Most buyers are between 30 and 50 years old.',
      pony: 'This pony is retiring. Riders with a short 0–5 mile commute are switching to bikes!',
      hay: 'Hay bales. Even the pony prefers a short commute.',
    },
    building: { x: 12, y: 6, w: 6, h: 4, door: 2, style: { wall: '#a5483a', wallKind: 'planks', trim: '#f0e2c0', roof: '#5b3a29', sign: 'horseshoe', barn: true } },
    keeper: {
      name: 'Stablehand Tobi',
      look: { hair: '#d9a03a', shirt: '#7a8a3a', pants: '#3b3b5c', hat: '#e3c26b', hatStyle: 'straw' },
      lines: [
        ['Horses are out, bikes are in! The chalkboard shows who\'s buying.'],
        ['Short commuters love bikes. Zero to five miles, that\'s the sweet spot.'],
      ],
    },
  },
  {
    id: 'sql',
    repo: 'SQL_PROJECT_-1',
    title: "Wizard's Archive",
    district: 'market',
    interior: 'wizardArchive',
    summary:
      'SQL project on a global layoffs dataset: cleaning the raw data, then exploring layoffs by company, industry, country, funding stage and year, including the top companies for layoffs each year.',
    stats: ['Data cleaning in SQL: duplicates, blanks, formats', 'Layoffs by company, industry, country, stage and year', 'Top companies by layoffs, ranked per year'],
    tech: ['SQL', 'MySQL'],
    facts: {
      shelves: 'Each bookshelf is a table: layoffs by company, industry, country, stage and year.',
      desk: 'Spell notes: "First, the cleaning spells. Remove duplicates, fix blanks, tidy the formats."',
      board: 'A ranking scroll: the top companies by layoffs, year by year.',
    },
    building: { x: 22, y: 3, w: 3, h: 7, door: 1, style: { type: 'tower', wall: '#8a86a0', trim: '#3f3556', roof: '#5b3f8c', sign: 'book' } },
    keeper: {
      name: 'Archmage Query',
      look: { hair: '#e8e8e8', beard: '#e8e8e8', shirt: '#5b3f8c', pants: '#3f3556', hat: '#5b3f8c', hatStyle: 'wizard', dress: '#4a3270' },
      lines: [
        ['Ah, a seeker of knowledge! Gaze into the crystal ball to read the layoffs archive.'],
        ['SELECT wisdom FROM experience WHERE patience > 0. Ahem. Wizard humour.'],
      ],
    },
  },

  // ------------------------------------------------------------ Herbal Lane
  {
    id: 'ivish',
    repo: 'Web_blog_66070349_Ivish',
    title: 'Botanical Greenhouse',
    district: 'herbal',
    interior: 'greenhouse',
    summary:
      'Web blog with a strategic analysis of IVISN, a herbal oral-care brand with heritage since 1921 that relaunched in 2021. It includes a SWOT analysis and a 4P marketing mix.',
    stats: ['Brand heritage since 1921', 'Relaunched in 2021', 'SWOT analysis', '4P marketing mix'],
    tech: ['Web blog', 'Brand strategy'],
    facts: {
      plaque: 'A brass plaque: "IVISN, herbal oral care since 1921."',
      planters: 'Four planters: Strengths, Weaknesses, Opportunities, Threats. A SWOT garden!',
      poster: 'A poster: "Relaunched in 2021, with a 4P plan: Product, Price, Place, Promotion."',
    },
    building: { x: 36, y: 5, w: 6, h: 5, door: 3, style: { type: 'glass', wall: '#a9dccf', trim: '#eef3e8', roof: '#a9dccf', sign: 'leaf' } },
    keeper: {
      name: 'Gardener Ivy',
      look: { hair: '#5a3a22', shirt: '#7cc062', pants: '#5b3a29', hat: '#f6a5c0', hatStyle: 'flower', long: true },
      lines: [
        ['This greenhouse grows the story of IVISN, an herbal brand older than anyone in town!', 'The display table has the full blog.'],
        ['Over a hundred years old, and it got a fresh start in 2021. Like pruning a rose bush!'],
      ],
    },
  },
  {
    id: 'thepthai',
    repo: 'Web_blog_66070349_Thepthai',
    title: "Herbalist's Workshop",
    district: 'herbal',
    interior: 'herbalWorkshop',
    summary:
      'Web blog with a business case study of Thepthai herbal toothpaste from Songkhla: how the brand grew after the 1997 financial crisis, and its famous "green bean size" rule.',
    stats: ['Origins in Songkhla, southern Thailand', 'Grew after the 1997 financial crisis', 'The "green bean size" usage rule'],
    tech: ['Web blog', 'Business case study'],
    facts: {
      map: 'A map of Thailand with a pin in Songkhla, where it all started.',
      jars: 'Old jars dated 1997. The workshop kept going through the financial crisis and grew from there.',
      sign: 'House rule: use only a "green bean size" of toothpaste. A little goes a long way!',
    },
    building: { x: 45, y: 6, w: 5, h: 4, door: 2, style: { wall: '#d9c49a', trim: '#5b3a22', roof: '#3d7f74', sign: 'mortar', chimney: true, herbs: true } },
    keeper: {
      name: 'Herbalist Somchai',
      look: { hair: '#2a1c14', shirt: '#3d7f74', pants: '#5b3a29', apron: '#e9d7a8', skin: '#d9a57a', glasses: true },
      lines: [
        ['Welcome to the workshop! The mortar on the table holds the whole recipe.'],
        ['Just a green bean\'s worth of paste. Any more is a waste!'],
      ],
    },
  },
];

for (const p of PROJECTS) p.url = repoUrl(p.repo);

export const byId = (id) => PROJECTS.find((p) => p.id === id);
