import Phaser from 'phaser';
import './style.css';
import BootScene from './scenes/BootScene.js';
import TownScene from './scenes/TownScene.js';
import InteriorScene from './scenes/InteriorScene.js';
import { initUI } from './ui/HUD.js';

initUI();

window.__game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#20301c',
  pixelArt: true,
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
  scene: [BootScene, TownScene, InteriorScene],
});
