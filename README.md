# Vinny's Pixel Galaxy

A pixel-art space game portfolio. Fly a ship through a galaxy where every planet is one of my data projects. Land on a planet, explore it, and collect its 4 **data crystals** to uncover the charts and findings. Then open the project on GitHub from the planet's beacon.

Built with [Phaser 3](https://phaser.io) and Vite. All pixel art is drawn in code at startup, so there are no image files.

## What's inside

- **Space:** 3 star systems (Python & ML, Dashboards, Brand Stories) with 10 rotating, orbiting planets. There are also asteroid belts to shoot for stardust, probe logs to read, a space whale, comets, and a home station (About me, a mission board with autopilot and warp, and a logbook).
- **Planets:** each one is a side-scrolling world with its own terrain, weather and props. It has a mission briefing terminal, 4 data crystals on platforms (one animated chart and three findings), a resident to talk to, a toolbox monolith (tech stack) and a GitHub beacon.
- **Progress:** 40 crystals, 10 achievements, a finale. Progress is saved in the browser.
- **For a quick look:** "Skip to the projects" on the title screen (or **P** in game) lists every project in plain text.
- **The old pixel town:** the first version of this site lives on at `town.html`, reached through the warp gate in space.

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
```

## Controls

| | Space | Planet |
|---|---|---|
| Move | WASD / arrows | A D / ← → |
| Action | Space shoots, Shift boosts | W / ↑ / Space jumps (twice for a double jump) |
| Interact | E lands / docks / reads | E uses terminals, talks |
| Leave | | Esc returns to orbit |

**P** opens the mission board, **L** the logbook, and **M** toggles sound. Phones get a D-pad plus A (interact) and B (shoot / jump) buttons.

## Editing content

- **Project text, findings and chart data:** `src/data/projects.js` (`PROJECTS` and `SKY`)
- **About me:** `src/data/about.js`
- **Galaxy layout, planet looks, probe logs, achievements:** `src/galaxy/data.js`
- **Old town:** `src/data/`, `src/scenes/`, `src/interiors/` (served as `town.html`)

To add a project, add it to `PROJECTS` and `SKY` in `projects.js` and give it a planet in `PLANETS` in `src/galaxy/data.js`.

## Deploying to GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds and publishes on every push to `main`. In the repository settings, set **Pages → Source** to **GitHub Actions**.
