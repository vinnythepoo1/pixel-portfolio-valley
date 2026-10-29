import Phaser from 'phaser';
import { buildTown, MAP_W, MAP_H, SPAWN, districtAt } from '../data/townMap.js';
import { PROJECTS } from '../data/projects.js';
import { TOWN_NPCS } from '../data/npcs.js';
import { genBuilding } from '../art/sprites.js';
import Grid from '../systems/Grid.js';
import Player from '../systems/Player.js';
import NPC from '../systems/NPC.js';
import Ambient from '../systems/Ambient.js';
import { createKeys, readInput, findTarget } from '../systems/Input.js';
import { advanceTime, lighting, hourNow } from '../systems/DayNight.js';
import { audio } from '../systems/Audio.js';
import { state, bus, uiBlocked, baseZoom } from '../state.js';
import { say } from '../ui/DialogBox.js';
import { openList, openAbout } from '../ui/ListOverlay.js';

const ADD = Phaser.BlendModes.ADD;
const FORTUNES = [
  'The coin sinks with a sparkle. Your fortune: "A clean dataset is coming your way."',
  'Plink! Your fortune: "Your next model will not overfit."',
  'Splash! Your fortune: "Great insights hide in the outliers."',
  'The water shimmers. Your fortune: "Today is a good day to visit the Harbor."',
  'Plop. Your fortune: "Someone will star your repository."',
];

export default class TownScene extends Phaser.Scene {
  constructor() { super('Town'); }

  create() {
    const town = buildTown();
    const map = this.make.tilemap({ data: town.ground, tileWidth: 16, tileHeight: 16 });
    const tiles = map.addTilesetImage('tiles', 'tiles', 16, 16, 0, 0);
    this.layer = map.createLayer(0, tiles, 0, 0).setDepth(-1000);
    this.grid = Grid.fromRows(town.solid);

    this.interactables = [];
    this.doors = [];
    this.buildings = [];
    this.windowGlows = [];
    this.lampGlows = [];
    this.chimneys = [];
    this.transitioning = false;

    this.placeBuildings();
    this.placeDecor(town.decor);

    this.player = new Player(this, this.grid, SPAWN.tx * 16 + 8, SPAWN.ty * 16 + 12);
    this.player.dir = 'up';
    this.npcs = TOWN_NPCS.map((def) => new NPC(this, this.grid, def, hourNow()));

    this.ambient = new Ambient(this, { layer: this.layer, grassSpots: town.grassSpots, chimneys: this.chimneys, fountain: this.fountain });
    this.addCat();

    // day/night tint over the whole world
    this.overlay = this.add.rectangle(0, 0, MAP_W * 16, MAP_H * 16, 0xffffff).setOrigin(0).setDepth(10000).setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.prompt = this.add.image(0, 0, 'promptE').setDepth(10003).setVisible(false);
    this.clickMark = this.add.image(0, 0, 'sparkle').setDepth(10003).setVisible(false);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_W * 16, MAP_H * 16).setRoundPixels(true);
    cam.startFollow(this.player.sprite, true, 0.15, 0.15);
    this.applyZoom();
    this.scale.on('resize', this.applyZoom, this);

    this.keys = createKeys(this);
    this.setupPointer();

    this.events.on('wake', this.onWake, this);
    const onTravel = (id) => { if (this.scene.isActive()) this.travelTo(id); };
    bus.on('travel', onTravel);
    this.events.once('shutdown', () => { bus.off('travel', onTravel); this.scale.off('resize', this.applyZoom, this); });

    this.lastDistrict = null;
  }

  applyZoom() {
    this.cameras.main.setZoom(baseZoom(this.scale.width, this.scale.height));
  }

  // ---------------------------------------------------------------- world building
  placeBuildings() {
    for (const p of PROJECTS) {
      const b = p.building;
      const key = `bld_${p.id}`;
      const meta = genBuilding(this, key, b);
      const x = b.x * 16, bottom = (b.y + b.h) * 16, top = bottom - meta.h;
      this.add.image(x, bottom, key).setOrigin(0, 1).setDepth(bottom);

      for (const w of meta.windows) {
        this.windowGlows.push(this.add.rectangle(x + w.x, top + w.y, w.w, w.h, 0xffcf6e).setOrigin(0).setBlendMode(ADD).setDepth(10001).setAlpha(0));
      }
      if (meta.chimney) this.chimneys.push({ x: x + meta.chimney.x, y: top + meta.chimney.y + 2, depth: bottom + 1 });

      const door = { tx: b.x + b.door, ty: b.y + b.h - 1, project: p };
      door.glow = this.add.rectangle(x + meta.door.x, top + meta.door.y, meta.door.w, meta.door.h, 0xfff1b0)
        .setOrigin(0).setBlendMode(ADD).setDepth(bottom + 0.5).setAlpha(0);
      this.doors.push(door);
      this.buildings.push({ p, door, rect: new Phaser.Geom.Rectangle(x, top, meta.w, meta.h) });
      this.interactables.push({
        rect: { x: door.tx * 16, y: door.ty * 16, w: 16, h: 16 },
        by: top + meta.door.y - 10,
        act: () => this.enter(p),
      });
    }
  }

  placeDecor(decor) {
    for (const d of decor) {
      const fw = d.fw || 1, fh = d.fh || 1;
      const rect = { x: d.tx * 16 - 3, y: (d.ty - fh + 1) * 16 - 3, w: fw * 16 + 6, h: fh * 16 + 6 };
      if (d.kind !== 'zone') {
        const x = (d.tx + fw / 2) * 16 + (d.dx || 0), y = (d.ty + 1) * 16 + (d.offY || 0);
        const frame = this.textures.get(d.tex).has('0') ? '0' : undefined;
        const s = this.add.sprite(x, y, d.tex, frame).setOrigin(0.5, 1).setDepth(d.kind === 'boat' ? y - 8 : y);
        if (d.anim) s.play({ key: d.anim, startFrame: Phaser.Math.Between(0, 1) });
        if (d.kind === 'lamp') {
          this.lampGlows.push(this.add.image(x, y - 24, 'glow').setBlendMode(ADD).setDepth(10001).setAlpha(0).setScale(1.3));
        }
        if (d.kind === 'fountain') this.fountain = { x, y: y - 40, depth: y + 1 };
        if (d.kind === 'boat') this.tweens.add({ targets: s, y: y + 1.5, duration: 1400 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        if (d.kind === 'bell') this.bell = s;
      }
      if (d.say || d.act) {
        this.interactables.push({ rect, act: () => this.useDecor(d) });
      }
    }
  }

  addCat() {
    const x = 35 * 16 + 8, y = 28 * 16 + 10;
    this.cat = this.add.sprite(x, y, 'cat', '0').setOrigin(0.5, 1).setDepth(y);
    this.cat.play('cat');
    this.grid.set(35, 28);
    this.interactables.push({ rect: { x: x - 10, y: y - 14, w: 20, h: 16 }, act: () => this.petCat() });
  }

  // ---------------------------------------------------------------- interactions
  useDecor(d) {
    switch (d.act) {
      case 'list': openList(); break;
      case 'about': openAbout(); break;
      case 'fountain': this.tossCoin(); break;
      case 'bell': this.ringBell(); break;
      default:
        audio.sfx('chime');
        say(d.say, { name: d.name || '' });
    }
  }

  tossCoin() {
    const p = this.player, f = this.fountain;
    const coin = this.add.image(p.x, p.y - 14, 'coin').setDepth(9800);
    audio.sfx('coin');
    this.tweens.add({ targets: coin, x: f.x, duration: 600 });
    this.tweens.add({
      targets: coin, y: { from: p.y - 14, to: p.y - 44 }, duration: 300, yoyo: true, ease: 'Quad.easeOut',
      onComplete: () => {
        coin.destroy();
        audio.sfx('splash');
        const fx = this.add.particles(f.x, f.y + 34, 'sparkle', { lifespan: 700, speed: { min: 20, max: 50 }, scale: { start: 1, end: 0 }, emitting: false }).setDepth(9800);
        fx.explode(10);
        this.time.delayedCall(900, () => fx.destroy());
        say([Phaser.Utils.Array.GetRandom(FORTUNES)], { name: 'Fountain' });
      },
    });
  }

  ringBell() {
    audio.sfx('bell');
    this.cameras.main.shake(180, 0.004);
    if (this.bell) this.tweens.add({ targets: this.bell, angle: { from: -4, to: 4 }, duration: 120, yoyo: true, repeat: 3, onComplete: () => this.bell.setAngle(0) });
    this.ambient.scareBirds(this.player.x, this.player.y, 2000);
    say(['DONNNG! The guild bell rings out across the harbor.', 'Somewhere, a seagull complains loudly.'], { name: 'Guild bell' });
  }

  petCat() {
    audio.sfx('purr');
    const fx = this.add.particles(this.cat.x, this.cat.y - 12, 'heart', { lifespan: 900, speedY: { min: -30, max: -18 }, speedX: { min: -12, max: 12 }, alpha: { start: 1, end: 0 }, emitting: false }).setDepth(9800);
    fx.explode(4);
    this.time.delayedCall(1000, () => fx.destroy());
    say(['Mrrrow~', 'The cat purrs and rolls over. It seems to like you.'], { name: 'Plaza cat' });
  }

  setupPointer() {
    this.input.on('pointermove', (p) => {
      if (!state.started || state.uiOpen) { bus.emit('hover', null); return; }
      const b = this.buildingAt(p.worldX, p.worldY);
      this.input.setDefaultCursor(b ? 'pointer' : 'default');
      bus.emit('hover', b ? { title: b.p.title, sub: `${b.p.repo} · click to visit`, x: p.x, y: p.y } : null);
    });
    this.input.on('pointerdown', (p) => {
      if (uiBlocked() || this.transitioning) return;
      const b = this.buildingAt(p.worldX, p.worldY);
      const [tx, ty] = b ? [b.door.tx, b.door.ty] : [Math.floor(p.worldX / 16), Math.floor(p.worldY / 16)];
      if (this.player.walkTo(tx, ty)) {
        const last = this.player.path[this.player.path.length - 1];
        this.clickMark.setPosition(last.x * 16 + 8, last.y * 16 + 8).setVisible(true).setAlpha(1);
        this.tweens.add({ targets: this.clickMark, alpha: 0, duration: 700, onComplete: () => this.clickMark.setVisible(false) });
      }
    });
  }

  buildingAt(x, y) {
    return this.buildings.find((b) => Phaser.Geom.Rectangle.Contains(b.rect, x, y));
  }

  // ---------------------------------------------------------------- doors & travel
  enter(p) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.player.path = null;
    this.prompt.setVisible(false);
    bus.emit('hover', null);
    audio.sfx('door');
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.launch('Interior', { id: p.id });
      this.scene.sleep();
    });
  }

  onWake(sys, data) {
    this.transitioning = false;
    this.lastDistrict = null; // re-announce the district after leaving a building
    this.input.keyboard.resetKeys();
    const id = data?.travel || data?.from;
    if (id) this.placeAtDoor(id);
    this.cameras.main.fadeIn(260, 0, 0, 0);
  }

  placeAtDoor(id) {
    const d = this.doors.find((door) => door.project.id === id);
    if (!d) return;
    this.player.path = null;
    this.player.setPos(d.tx * 16 + 8, (d.ty + 1) * 16 + 12);
    this.player.dir = 'down';
    this.player.animate(false);
    this.cameras.main.centerOn(this.player.x, this.player.y);
  }

  travelTo(id) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.placeAtDoor(id);
      this.transitioning = false;
      this.cameras.main.fadeIn(260, 0, 0, 0);
    });
  }

  // ---------------------------------------------------------------- loop
  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    advanceTime(delta);
    const hour = hourNow();

    const input = readInput(this.keys);
    if (!this.transitioning) this.player.control(dt, input.x, input.y);
    else this.player.animate(false);
    for (const n of this.npcs) n.update(dt, hour);

    // door check
    const door = this.doors.find((d) => d.tx === this.player.tx && d.ty === this.player.ty);
    if (door && !this.transitioning) this.enter(door.project);

    // interaction target + prompt bubble
    const target = this.transitioning || uiBlocked() ? null : findTarget(this.player, this.npcs, this.interactables);
    if (target) {
      this.prompt.setPosition(Math.round(target.bx), Math.round(target.by + Math.sin(time / 200) * 1.5)).setVisible(true);
      if (input.act) {
        if (target.npc) target.npc.talk(this.player);
        else target.item.act();
      }
    } else {
      this.prompt.setVisible(false);
    }

    // doors glow softly when the player is close
    for (const d of this.doors) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, d.tx * 16 + 8, d.ty * 16 + 8);
      d.glow.setAlpha(dist < 40 ? 0.18 + 0.1 * Math.sin(time / 180) : 0);
    }

    // lighting
    const L = lighting(state.minutes);
    const wet = state.weather === 'rain' ? 0.86 : 1;
    this.overlay.setFillStyle(Phaser.Display.Color.GetColor(L.r * 255 * wet, L.g * 255 * wet, L.b * 255 * Math.min(1, wet + 0.06)), 1);
    for (const g of this.windowGlows) g.setAlpha(L.night * 0.7);
    for (const g of this.lampGlows) g.setAlpha(L.night * (0.75 + 0.08 * Math.sin(time / 150 + g.x)));
    this.ambient.update(time, L.night, this.player);

    // district banner
    const district = districtAt(this.player.tx, this.player.ty);
    if (district !== this.lastDistrict) {
      this.lastDistrict = district;
      state.district = district;
      if (state.started) bus.emit('district', district);
    }
  }
}
