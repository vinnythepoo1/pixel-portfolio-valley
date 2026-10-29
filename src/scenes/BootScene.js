import Phaser from 'phaser';
import { genTiles, genDecor } from '../art/sprites.js';

// No image files to load: all pixel art is drawn into textures here.
export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    genTiles(this);
    genDecor(this);
    this.scene.start('Town');
  }
}
