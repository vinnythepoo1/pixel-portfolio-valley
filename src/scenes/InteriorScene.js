import Phaser from 'phaser';
import Room from './Room.js';
import { INTERIORS } from '../interiors/index.js';
import { byId } from '../data/projects.js';
import Player from '../systems/Player.js';
import { createKeys, readInput, findTarget } from '../systems/Input.js';
import { advanceTime } from '../systems/DayNight.js';
import { addStamp } from '../systems/Quest.js';
import { audio } from '../systems/Audio.js';
import { bus, uiBlocked } from '../state.js';

export default class InteriorScene extends Phaser.Scene {
  constructor() { super('Interior'); }

  create(data) {
    this.project = byId(data.id);
    this.room = new Room(this, this.project);
    INTERIORS[this.project.interior](this.room, this.project);
    const { W, H, exitX } = this.room;

    this.player = new Player(this, this.room.grid, exitX * 16 + 8, (H - 2) * 16 + 12);
    this.player.dir = 'up';
    this.player.animate(false);
    this.prompt = this.add.image(0, 0, 'promptE').setDepth(10003).setVisible(false);
    this.transitioning = false;

    const cam = this.cameras.main;
    cam.setBackgroundColor('#140e0b');
    this.fitCamera();
    this.scale.on('resize', this.fitCamera, this);
    cam.fadeIn(260, 0, 0, 0);

    this.keys = createKeys(this);
    this.input.on('pointerdown', (p) => {
      if (uiBlocked() || this.transitioning) return;
      this.player.walkTo(Math.floor(p.worldX / 16), Math.floor(p.worldY / 16));
    });

    const onTravel = (id) => this.exit({ travel: id });
    bus.on('travel', onTravel);
    this.events.once('shutdown', () => {
      bus.off('travel', onTravel);
      this.scale.off('resize', this.fitCamera, this);
    });

    bus.emit('banner', { title: this.project.title, sub: this.project.repo });
    const res = addStamp(this.project.id);
    bus.emit('stamp', { ...res, title: this.project.title });
    this.roomSize = { W, H };
  }

  // Zoom so the whole room fits on screen.
  fitCamera() {
    const { W, H } = this.room;
    const cam = this.cameras.main;
    const zoom = Math.min(this.scale.width / (W * 16 + 24), this.scale.height / (H * 16 + 40));
    cam.setZoom(Math.max(0.5, zoom));
    cam.centerOn((W * 16) / 2, (H * 16) / 2 + 4);
  }

  exit(data = { from: this.project.id }) {
    if (this.transitioning) return;
    this.transitioning = true;
    audio.sfx('door');
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.wake('Town', data);
      this.scene.stop();
    });
  }

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    advanceTime(delta);
    const input = readInput(this.keys);
    if (this.transitioning) return;
    this.player.control(dt, input.x, input.y);

    if (this.player.ty >= this.room.H - 1) { this.exit(); return; }

    const target = uiBlocked() ? null : findTarget(this.player, this.room.keepers, this.room.items);
    if (target) {
      this.prompt.setPosition(Math.round(target.bx), Math.round(target.by + Math.sin(time / 200) * 1.5)).setVisible(true);
      if (input.act) {
        if (target.npc) target.npc.talk(this.player);
        else target.item.act();
      }
    } else {
      this.prompt.setVisible(false);
    }
  }
}
