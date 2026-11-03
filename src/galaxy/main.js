import Phaser from 'phaser';
import './galaxy.css';
import { PROJECTS } from '../data/projects.js';
import { PLANETS } from './data.js';
import { genSpaceArt, genPlanet } from './art.js';
import { genAstronaut, genStructures } from './surfaceArt.js';
import SpaceScene from './SpaceScene.js';
import PlanetScene from './PlanetScene.js';
import { initHud } from './hud.js';

// Draws every texture up front (no image files), then starts in space.
class GalaxyBoot extends Phaser.Scene {
  constructor() { super('GalaxyBoot'); }

  create() {
    genSpaceArt(this);
    genAstronaut(this);
    genStructures(this);
    PROJECTS.forEach((p, i) => genPlanet(this, `pl_${p.id}`, PLANETS[p.id].size, PLANETS[p.id].look, i * 17 + 3));
    this.scene.start('Space');
  }
}

initHud();

// Wait (briefly) for the pixel font so in-game labels use it.
const fontReady = Promise.race([
  document.fonts?.load('12px "Pixelify Sans"').catch(() => null),
  new Promise((r) => setTimeout(r, 1500)),
]);

fontReady.then(() => {
  window.__game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#05041a',
    pixelArt: true,
    scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
    scene: [GalaxyBoot, SpaceScene, PlanetScene],
  });
});
