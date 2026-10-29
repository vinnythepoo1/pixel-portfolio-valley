# Vinny's Pixel Town

A pixel-art fantasy town where every building is one of my GitHub projects. Walk around, step inside, talk to the townsfolk, and collect a stamp for every building in the Explorer's Journal.

Built with [Phaser 3](https://phaser.io) and Vite. All pixel art is drawn in code at startup, so there are no image files.

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
```

## Controls

| Key | Action |
|---|---|
| WASD / arrow keys, or click | Walk |
| E / Space | Talk, read, open doors |
| J | Explorer's Journal |
| P | Project list |
| M | Sound on/off |

Phones get an on-screen D-pad and an A button.

## Editing content

- **Projects**: `src/data/projects.js` (summary, key findings, tech badges, building position and style, shopkeeper lines)
- **About letter**: `src/data/about.js`
- **Townsfolk**: `src/data/npcs.js`
- **Town layout** (roads, lamps, signs, props): `src/data/townMap.js`
- **Interiors**: one file per building in `src/interiors/`

To add a project, add an entry to `projects.js` with a free spot on the map, then either reuse an existing `interior` key or add a new builder in `src/interiors/` and register it in `src/interiors/index.js`.

## Deploying to GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds and publishes on every push to `main`. In the repository settings, set **Pages → Source** to **GitHub Actions**.
