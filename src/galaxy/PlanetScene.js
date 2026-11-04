import Phaser from 'phaser';
import { byId, SKY, PROJECTS } from '../data/projects.js';
import { PLANETS, SYSTEMS } from './data.js';
import { genSurface, ASTRO } from './surfaceArt.js';
import { genChar, ensureCharAnims } from '../art/sprites.js';
import { bevel, OUTLINE } from '../art/canvas.js';
import { state, bus, uiBlocked, consumeTouchA } from '../state.js';
import { audio } from '../systems/Audio.js';
import { say } from '../ui/DialogBox.js';
import { progress, unlock } from './progress.js';
import { openBriefing, openCrystal, openTech, openBeacon, celebrateAll } from './hud.js';

const W = 2700, GH = 300, GY = 250;
const FONT = { fontFamily: '"Pixelify Sans", monospace', fontSize: '10px', color: '#ffffff', stroke: '#1a1430', strokeThickness: 3, align: 'center' };
// Platforms [x, y] and the 4 crystals [x, y] (same course on every planet; looks change per planet).
const PLATFORMS = [[700, 205], [1050, 205], [1150, 165], [1650, 195], [1760, 155], [2050, 210], [2150, 175], [2250, 140]];
const CRYSTALS = [[700, 186], [1150, 146], [1760, 136], [2250, 121]];
const SPOTS = { ship: 150, terminal: 360, alien: 950, monolith: 1420, beacon: 2520 };
// Physics toys [x, kind, dropHeight]: crates to push and climb, balls to kick and bounce on.
const TOYS = [[560, 'box', 30], [640, 'ball', 60], [1220, 'box', 30], [1226, 'box', 70], [1290, 'ball', 40], [1880, 'ball', 80], [2120, 'box', 30], [2380, 'ball', 50]];

// Weather particle settings per planet theme.
const WEATHER = {
  bubbles: { key: 'puff', tint: [0xffd1e0, 0xffffff], speedY: { min: -30, max: -12 }, speedX: { min: -6, max: 6 }, scale: { start: 0.5, end: 0.9 }, alpha: { start: 0.6, end: 0 }, lifespan: 7000, frequency: 160, fromBottom: true },
  sand: { key: 'streak', tint: [0xffe2b0, 0xe8b070], speedX: { min: -180, max: -120 }, speedY: { min: 5, max: 20 }, alpha: { start: 0.6, end: 0 }, lifespan: 3500, frequency: 30, fromRight: true },
  snow: { key: 'dot', tint: [0xffffff], speedY: { min: 20, max: 40 }, speedX: { min: -10, max: 10 }, alpha: { start: 0.9, end: 0.3 }, lifespan: 9000, frequency: 60 },
  coins: { key: 'dot', tint: [0xffd75e, 0xfff0a0], speedY: { min: 25, max: 45 }, speedX: { min: -5, max: 5 }, alpha: { start: 1, end: 0.2 }, lifespan: 7000, frequency: 140 },
  leaves: { key: 'dot', tint: [0x7cc062, 0xd9873a, 0xe2b23a], speedY: { min: 15, max: 30 }, speedX: { min: 10, max: 30 }, rotate: { start: 0, end: 360 }, lifespan: 10000, frequency: 120 },
  fireflies: { key: 'dot', tint: [0xd8ff6a, 0xffe27a], speedY: { min: -8, max: 8 }, speedX: { min: -8, max: 8 }, alpha: { start: 0, end: 1, ease: 'Sine.easeInOut', yoyo: true }, lifespan: 4000, frequency: 120, add: true, anywhere: true },
  wind: { key: 'streak', tint: [0xffffff], speedX: { min: 140, max: 220 }, alpha: { start: 0.5, end: 0 }, lifespan: 3000, frequency: 90, fromLeft: true },
  sparkles: { key: 'dot', tint: [0x9f7cff, 0x7fe0ff, 0xffffff], speedY: { min: -10, max: 10 }, alpha: { start: 1, end: 0 }, scale: { start: 1, end: 0 }, lifespan: 2000, frequency: 50, add: true, anywhere: true },
  pollen: { key: 'dot', tint: [0xfff0a0, 0xffd1e0], speedY: { min: -6, max: 8 }, speedX: { min: 4, max: 16 }, alpha: { start: 0.9, end: 0 }, lifespan: 8000, frequency: 100, anywhere: true },
  mist: { key: 'puff', tint: [0xd0f0e0], speedX: { min: 6, max: 14 }, scale: { start: 2, end: 4 }, alpha: { start: 0.18, end: 0 }, lifespan: 9000, frequency: 400, low: true },
};

export default class PlanetScene extends Phaser.Scene {
  constructor() { super('Planet'); }

  create(data) {
    const p = byId(data.id);
    const pd = PLANETS[p.id], s = pd.surface;
    this.p = p; this.s = s;
    genSurface(this, p.id, s);
    this.leaving = false;

    this.physics.world.setBounds(0, 0, W, GH);
    this.physics.world.gravity.y = s.gravity;
    this.jumpV = Math.sqrt(2 * s.gravity * 74);

    // backdrop. The camera never scrolls vertically, so sky layers only use a horizontal scroll factor
    // (a vertical factor below 1 gets stretched by the zoom).
    this.add.image(-1000, 0, `sky_${p.id}`).setOrigin(0).setScrollFactor(0, 1).setDisplaySize(6000, GH).setDepth(-100);
    const sysKey = p.district;
    this.add.image(560, 60, 'glow').setScrollFactor(0.03, 1).setScale(3).setTint(Phaser.Display.Color.HexStringToColor(SYSTEMS[sysKey].sun).color).setAlpha(0.7).setBlendMode(Phaser.BlendModes.ADD).setDepth(-95);
    this.add.sprite(560, 60, `sun_${sysKey}`, '0').play(`sun_${sysKey}`).setScrollFactor(0.03, 1).setScale(0.5).setDepth(-94);
    const sibling = PROJECTS.find((x) => x.district === p.district && x.id !== p.id) || PROJECTS.find((x) => x.id !== p.id);
    this.add.sprite(300, 80, `pl_${sibling.id}`, '0').play(`pl_${sibling.id}`).setScrollFactor(0.05, 1).setScale(0.8).setDepth(-93);
    for (let i = 0; i < 60; i++) {
      const st = this.add.image(Phaser.Math.Between(0, 1400), Phaser.Math.Between(0, 140), 'dot').setScrollFactor(0.02, 1).setScale(0.5).setAlpha(0.2).setDepth(-96);
      this.tweens.add({ targets: st, alpha: 0.7, duration: Phaser.Math.Between(800, 2400), yoyo: true, repeat: -1 });
    }
    const clouds = this.add.tileSprite(0, 20, W, 90, `clouds_${p.id}`).setOrigin(0).setScrollFactor(0.12, 1).setAlpha(0.85).setDepth(-91);
    this.tweens.add({ targets: clouds, tilePositionX: 512, duration: 90000, repeat: -1 });
    this.add.tileSprite(0, GY - 110, W, 120, `far_${p.id}`).setOrigin(0).setScrollFactor(0.25, 1).setDepth(-90);
    this.add.tileSprite(0, GY - 70, W, 90, `mid_${p.id}`).setOrigin(0).setScrollFactor(0.5, 1).setDepth(-80);

    // ground
    this.add.tileSprite(0, GY, W, 64, `gnd_${p.id}`).setOrigin(0).setDepth(5);
    this.fg = this.add.tileSprite(0, GH - 32, W, 32, `fg_${p.id}`).setOrigin(0).setScrollFactor(1.3, 1).setDepth(25);
    const ground = this.add.rectangle(W / 2, GY + 32, W, 64);
    this.physics.add.existing(ground, true);

    // decorations from this planet's theme
    const R = new Phaser.Math.RandomDataGenerator([p.id]);
    const avoid = Object.values(SPOTS);
    for (let x = 60; x < W - 40; x += R.between(55, 110)) {
      if (avoid.some((a) => Math.abs(a - x) < 50)) continue;
      const key = `prop_${R.pick(s.props)}_${p.id}`;
      if (!this.textures.exists(key)) continue;
      const back = R.frac() < 0.4;
      const img = this.add.image(x, GY + (back ? -2 : 1), key).setOrigin(0.5, 1).setDepth(back ? -60 : 3).setTint(back ? 0xb0a8c8 : 0xffffff).setScale(back ? 0.85 : 1);
      if (!back) this.add.image(x, GY + 1, 'shadow').setDisplaySize(img.width * 1.1, 6).setDepth(2);
    }

    // platforms (you can jump up through them)
    this.platforms = this.physics.add.staticGroup();
    for (const [x, y] of PLATFORMS) this.platforms.create(x, y, `plat_${p.id}`).setDepth(6).refreshBody();

    // stations
    this.add.image(SPOTS.ship, GY, 'pad').setOrigin(0.5, 1).setDepth(4);
    this.add.image(SPOTS.ship, GY - 6, 'landedship').setOrigin(0.5, 1).setDepth(4);
    this.add.sprite(SPOTS.terminal, GY, 'terminal', '0').setOrigin(0.5, 1).play('terminal').setDepth(4);
    this.add.sprite(SPOTS.monolith, GY, 'monolith', '0').setOrigin(0.5, 1).play('monolith').setDepth(4);
    this.add.image(SPOTS.monolith, GY - 30, 'glow').setScale(1.2).setTint(0x9f7cff).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(3);
    this.add.sprite(SPOTS.beacon, GY, 'beacon', '0').setOrigin(0.5, 1).play('beacon').setDepth(4);
    this.add.image(SPOTS.beacon, GY - 64, 'glow').setScale(1).setTint(0xffd75e).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(3);
    const sign = (x, y, text) => this.add.text(x, y, text, FONT).setOrigin(0.5, 1).setResolution(3).setDepth(7);
    sign(SPOTS.ship, GY - 40, 'YOUR SHIP');
    sign(SPOTS.terminal, GY - 34, 'MISSION BRIEFING');
    sign(SPOTS.monolith, GY - 50, 'TOOLBOX');
    sign(SPOTS.beacon, GY - 74, 'GITHUB BEACON');
    sign(700, 46, `PLANET ${s.name.toUpperCase()}`).setFontSize(16).setScrollFactor(0.15, 1).setAlpha(0.5).setDepth(-85);

    // resident (the old town's shopkeeper, now living here)
    const k = p.keeper;
    const alienKey = genChar(this, `alien_${p.id}`, { ...k.look, skin: s.alien });
    ensureCharAnims(this, alienKey);
    const atex = this.textures.get(alienKey);
    if (!atex.bevelled && atex.getContext) { bevel(atex.getContext(), atex.width, atex.height, 16, OUTLINE); atex.refresh(); atex.bevelled = true; }
    this.alienShadow = this.add.image(SPOTS.alien, GY + 1, 'shadow').setScale(0.6).setDepth(7);
    this.alien = this.add.sprite(SPOTS.alien, GY + 1, alienKey, 'down0').setOrigin(0.5, 1).setDepth(8);
    this.alienKey = alienKey;
    this.alienHome = SPOTS.alien;
    this.alienDir = 1;
    this.alienLine = 0;
    this.alienBusy = 0;
    sign(SPOTS.alien, GY - 28, k.name).setAlpha(0.8);

    // crystals not collected yet
    this.crystals = this.physics.add.staticGroup();
    CRYSTALS.forEach(([x, y], n) => {
      if (progress.has('crystal', `${p.id}:${n}`)) return;
      const glow = this.add.image(x, y, 'glow').setScale(0.7).setTint(0x7ff0ff).setAlpha(0.6).setBlendMode(Phaser.BlendModes.ADD).setDepth(6);
      const c = this.crystals.create(x, y, 'crystal', '0').play('crystal').setDepth(7);
      c.n = n;
      c.glow = glow;
      this.tweens.add({ targets: [c, glow], y: y - 4, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });

    // little critters hopping around
    this.critters = [];
    for (let i = 0; i < 5; i++) {
      const c = this.physics.add.image(R.between(300, W - 300), GY - 10, 'critter').setDepth(4).setTint(Phaser.Display.Color.HexStringToColor(s.top).color);
      c.body.setSize(10, 8).setBounce(0.25).setDragX(260).setCollideWorldBounds(true);
      c.dir = R.frac() < 0.5 ? -1 : 1;
      c.next = 0;
      this.critters.push(c);
    }
    this.physics.add.collider(this.critters, ground);

    // player
    this.player = this.physics.add.sprite(SPOTS.ship + 40, GY - 20, 'astro', '0').setDepth(10);
    this.player.body.setSize(10, 22).setOffset(4, 4);
    this.playerShadow = this.add.image(this.player.x, GY + 1, 'shadow').setScale(0.7).setDepth(9);
    this.dustFx = this.add.particles(0, 0, 'puff', { lifespan: 450, speedX: { min: -40, max: 40 }, speedY: { min: -18, max: -4 }, scale: { start: 0.5, end: 0 }, alpha: { start: 0.7, end: 0 }, tint: Phaser.Display.Color.HexStringToColor(s.top).color, emitting: false }).setDepth(11);
    this.wasOnGround = true;
    this.fallSpeed = 0;
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, ground);
    this.physics.add.collider(this.player, this.platforms, null, (pl, plat) => pl.body.velocity.y >= 0 && pl.body.bottom <= plat.body.top + 6);
    this.physics.add.overlap(this.player, this.crystals, (pl, c) => this.collect(c));

    // physics toys
    const oneWay = (o, plat) => o.body.velocity.y >= 0 && o.body.bottom <= plat.body.top + 6;
    this.toys = [];
    for (const [x, kind, drop] of TOYS) {
      const t = this.physics.add.image(x, GY - drop, kind === 'box' ? 'phys_box' : 'phys_ball').setDepth(6);
      t.kind = kind;
      t.body.setCollideWorldBounds(true);
      if (kind === 'box') { t.body.setSize(18, 18).setMass(2.2).setBounce(0.05).setDragX(700).setMaxVelocityX(170); }
      else { t.body.setCircle(8).setMass(0.5).setBounce(0.72, 0.62).setDragX(70); t.kickedAt = 0; }
      this.toys.push(t);
    }
    this.physics.add.collider(this.toys, ground);
    this.physics.add.collider(this.toys, this.toys);
    this.physics.add.collider(this.toys, this.platforms, null, oneWay);
    this.physics.add.collider(this.critters, this.toys);
    const boxes = this.toys.filter((t) => t.kind === 'box'), balls = this.toys.filter((t) => t.kind === 'ball');
    this.physics.add.collider(this.player, boxes, () => { if (this.player.body.touching.down) this.jumps = 0; });
    this.physics.add.overlap(this.player, balls, (pl, b) => this.hitBall(b));
    this.jumps = 0;

    this.jet = this.add.particles(0, 0, 'puff', { lifespan: 400, speedY: { min: 30, max: 60 }, speedX: { min: -20, max: 20 }, scale: { start: 0.6, end: 0 }, tint: [0xffd75e, 0xffffff], emitting: false }).setDepth(9);
    this.sparkle = this.add.particles(0, 0, 'dot', { lifespan: 700, speed: { min: 40, max: 120 }, scale: { start: 1.5, end: 0 }, tint: [0x7ff0ff, 0xffffff, 0xffd75e], emitting: false, blendMode: 'ADD' }).setDepth(30);
    this.makeWeather(s.weather);

    this.prompt = this.add.image(0, 0, 'promptE').setDepth(40).setVisible(false);
    const cam = this.cameras.main;
    cam.setBounds(0, 0, W, GH).setRoundPixels(false);
    cam.startFollow(this.player, true, 0.1, 0.1);
    this.applyZoom();
    this.scale.on('resize', this.applyZoom, this);
    cam.fadeIn(500, 0, 0, 0);

    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,ENTER,SPACE,ESC');
    this.touchJumpHeld = false;

    const onLeave = () => this.leave();
    const onCourse = (id) => this.leave({ course: id });
    const onWarp = (id) => this.leave({ warp: id });
    bus.on('leavePlanet', onLeave);
    bus.on('course', onCourse);
    bus.on('warp', onWarp);
    this.events.once('shutdown', () => {
      bus.off('leavePlanet', onLeave); bus.off('course', onCourse); bus.off('warp', onWarp);
      this.scale.off('resize', this.applyZoom, this);
    });

    bus.emit('mode', 'planet');
    bus.emit('banner', { title: `Planet ${s.name}`, sub: SKY[p.id].name });
    if (progress.add('planet', p.id)) {
      unlock('landing');
      if (progress.count('planet') === PROJECTS.length) unlock('tour');
      this.time.delayedCall(1200, () => bus.emit('toast', '💎 4 data crystals are hidden here. Check the mission briefing terminal first!'));
    }
    this.lastTarget = null;
  }

  applyZoom() {
    this.cameras.main.setZoom(Math.max(1, this.scale.height / GH));
  }

  makeWeather(type) {
    const w = WEATHER[type];
    if (!w) return;
    const { key, fromBottom, fromRight, fromLeft, anywhere, low, add, ...cfg } = w;
    const emitter = this.add.particles(0, 0, key, {
      ...cfg,
      x: { min: 0, max: 900 },
      y: fromBottom ? GY : low ? { min: GY - 50, max: GY } : anywhere ? { min: 20, max: GY } : fromRight || fromLeft ? { min: 20, max: GY } : -5,
      blendMode: add ? 'ADD' : 'NORMAL',
    }).setDepth(20);
    this.weather = { emitter, fromRight, fromLeft };
  }

  // Stomp a ball to bounce high, or run into it to kick it.
  hitBall(b) {
    const pl = this.player, now = this.time.now;
    if (now - b.kickedAt < 180) return;
    b.kickedAt = now;
    if (pl.body.velocity.y > 40 && pl.body.bottom < b.body.center.y) {
      pl.body.setVelocityY(-this.jumpV * 1.15);
      this.jumps = 1;
      b.body.setVelocityY(Math.max(b.body.velocity.y, 0) + 160);
      this.cameras.main.shake(70, 0.002);
    } else {
      const dir = Math.sign(b.x - pl.x) || 1;
      const power = Math.max(140, Math.abs(pl.body.velocity.x) * 1.8);
      b.body.setVelocity(dir * power, -120 - Math.abs(pl.body.velocity.x) * 0.6);
    }
    audio.sfx('jump');
  }

  // ---------------------------------------------------------------- actions
  collect(c) {
    if (c.taken) return;
    c.taken = true;
    c.body.enable = false;
    const p = this.p;
    this.sparkle.explode(24, c.x, c.y);
    audio.sfx('crystal');
    this.tweens.killTweensOf([c, c.glow]);
    this.tweens.add({ targets: [c, c.glow], scale: 0, alpha: 0, duration: 350, onComplete: () => { c.destroy(); c.glow.destroy(); } });
    progress.add('crystal', `${p.id}:${c.n}`);
    this.time.delayedCall(300, () => openCrystal(p, c.n));
    if (progress.count('crystal', `${p.id}:`) === 4) {
      unlock('harvest');
      this.time.delayedCall(400, () => bus.emit('toast', `🌟 Planet ${this.s.name} complete! All 4 crystals collected.`));
    }
    if (progress.count('crystal') === PROJECTS.length * 4) {
      unlock('all');
      this.finale = true;
    }
  }

  talk() {
    const k = this.p.keeper;
    this.alienBusy = 7000;
    this.alien.anims.stop();
    this.alien.setFrame(this.player.x < this.alien.x ? 'left0' : 'right0');
    const lines = k.lines[this.alienLine % k.lines.length];
    this.alienLine++;
    say(lines, { name: k.name, portrait: this.textures.getBase64(this.alienKey, 'down0'), onDone: () => { this.alienBusy = 1500; } });
  }

  leave(then) {
    if (this.leaving) return;
    this.leaving = true;
    bus.emit('target', null);
    audio.sfx('warp');
    this.player.setVelocity(0, -200);
    this.cameras.main.fadeOut(450, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.wake('Space', { from: this.p.id, then });
      this.scene.stop();
    });
  }

  findTarget() {
    const px = this.player.x;
    if (this.player.y < GY - 70) return null;
    const near = (x, r = 30) => Math.abs(px - x) < r;
    if (near(SPOTS.ship)) return { key: 'ship', action: 'Board', name: 'your ship', sub: 'Return to orbit', x: SPOTS.ship, y: GY - 58, use: () => this.leave() };
    if (near(SPOTS.terminal)) return { key: 'term', action: 'Read', name: 'Mission briefing', sub: 'Summary & key findings', x: SPOTS.terminal, y: GY - 50, use: () => openBriefing(this.p) };
    if (near(this.alien.x, 26)) return { key: 'alien', action: 'Talk to', name: this.p.keeper.name, sub: '', x: this.alien.x, y: GY - 44, use: () => this.talk() };
    if (near(SPOTS.monolith)) return { key: 'mono', action: 'Inspect', name: 'Toolbox monolith', sub: 'Tools used in this project', x: SPOTS.monolith, y: GY - 66, use: () => openTech(this.p) };
    if (near(SPOTS.beacon)) return { key: 'beacon', action: 'Use', name: 'GitHub beacon', sub: this.p.repo, x: SPOTS.beacon, y: GY - 90, use: () => openBeacon(this.p) };
    return null;
  }

  // ---------------------------------------------------------------- loop
  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    const k = this.keys, t = state.touch, JD = Phaser.Input.Keyboard.JustDown;
    const jumpKey = [JD(k.W), JD(k.UP), JD(k.SPACE)].some(Boolean);
    const touchJump = (t.up || state.touchB) && !this.touchJumpHeld;
    this.touchJumpHeld = t.up || state.touchB;
    const act = [JD(k.E), JD(k.ENTER)].some(Boolean) | consumeTouchA();
    const esc = JD(k.ESC);
    const blocked = uiBlocked() || this.leaving;
    const pl = this.player, body = pl.body;
    const onGround = body.blocked.down || body.touching.down;
    if (onGround) this.jumps = 0;

    let dir = 0;
    if (!blocked) dir = (k.RIGHT.isDown || k.D.isDown || t.right ? 1 : 0) - (k.LEFT.isDown || k.A.isDown || t.left ? 1 : 0);
    const target = dir * 135;
    body.setVelocityX(body.velocity.x + (target - body.velocity.x) * Math.min(1, dt * (onGround ? 14 : 6)));
    if (dir) pl.setFlipX(dir < 0);

    // jump feel: coyote time, jump buffering, variable height, snappier falls
    const pressed = !blocked && (jumpKey || touchJump);
    this.jumpBuf = pressed ? 0.13 : (this.jumpBuf || 0) - dt;
    this.coyote = onGround ? 0.1 : (this.coyote || 0) - dt;
    const doJump = (n) => {
      this.jumps = n; this.jumpBuf = 0; this.coyote = 0; this.canCut = true;
      body.setVelocityY(-this.jumpV);
      audio.sfx('jump');
      if (n === 2) this.jet.explode(8, pl.x, pl.y + 10);
    };
    if (!blocked && this.jumpBuf > 0) {
      if (this.coyote > 0 && this.jumps === 0) doJump(1);
      else if (pressed && this.jumps < 2) doJump(2);
    }
    const held = k.W.isDown || k.UP.isDown || k.SPACE.isDown || t.up || state.touchB;
    if (this.canCut && !held && body.velocity.y < -this.jumpV * 0.35) { body.setVelocityY(body.velocity.y * 0.5); this.canCut = false; }
    body.setGravityY(body.velocity.y > 0 ? this.s.gravity * 0.55 : 0);
    body.maxVelocity.y = 560;
    if (!blocked && esc) this.leave();

    if (!onGround) { pl.anims.stop(); pl.setFrame(String(body.velocity.y < 0 ? ASTRO.jump : ASTRO.fall)); }
    else if (Math.abs(body.velocity.x) > 20) pl.anims.play('astro-walk', true);
    else pl.anims.play('astro-idle', true);

    // landing dust, and footstep puffs while running
    if (onGround && !this.wasOnGround && this.fallSpeed > 150) this.dustFx.explode(Math.min(10, Math.round(this.fallSpeed / 50)), pl.x, pl.body.bottom);
    if (onGround && Math.abs(body.velocity.x) > 100 && Math.random() < dt * 6) this.dustFx.emitParticleAt(pl.x - Math.sign(body.velocity.x) * 4, pl.body.bottom, 1);
    this.fallSpeed = body.velocity.y;
    this.wasOnGround = onGround;

    // contact shadow on whatever is below the astronaut, shrinking with height
    let floor = GY;
    for (const [x, y] of PLATFORMS) if (Math.abs(pl.x - x) < 24 && y - 6 >= pl.body.bottom - 2 && y - 6 < floor) floor = y - 6;
    const hgt = Math.max(0, floor - pl.body.bottom);
    this.playerShadow.setPosition(pl.x, floor + 1).setScale(Math.max(0.25, 0.7 - hgt / 160)).setAlpha(Math.max(0.3, 1 - hgt / 120));

    // resident strolls a little around their spot
    if (this.alienBusy > 0) this.alienBusy -= delta;
    else {
      this.alien.x += this.alienDir * 18 * dt;
      if (Math.abs(this.alien.x - this.alienHome) > 40) this.alienDir *= -1;
      this.alien.anims.play(`${this.alienKey}-${this.alienDir > 0 ? 'right' : 'left'}`, true);
    }
    this.alienShadow.x = this.alien.x;

    // critters hop around (real jumps under gravity) and scatter from the player
    for (const c of this.critters) {
      if (time > c.next && c.body.blocked.down) {
        c.next = time + Phaser.Math.Between(500, 1600);
        const scared = Math.abs(c.x - pl.x) < 60;
        if (scared) c.dir = c.x < pl.x ? -1 : 1;
        else if (Math.random() < 0.3) c.dir *= -1;
        if (c.x < 60) c.dir = 1; else if (c.x > W - 60) c.dir = -1;
        c.setFlipX(c.dir < 0);
        c.body.setVelocity(c.dir * Phaser.Math.Between(40, scared ? 120 : 70), -Phaser.Math.Between(scared ? 150 : 90, scared ? 200 : 140));
      }
    }

    // balls roll
    for (const b of this.toys) if (b.kind === 'ball') b.rotation += (b.body.velocity.x / 8) * dt;

    // weather follows the camera
    if (this.weather) {
      const v = this.cameras.main.worldView;
      this.weather.emitter.setPosition(this.weather.fromRight ? v.x + 120 : v.x - 100, 0);
    }

    const tg = blocked ? null : this.findTarget();
    const key = tg ? tg.key : null;
    if (key !== this.lastTarget) { this.lastTarget = key; bus.emit('target', tg && { action: tg.action, name: tg.name, sub: tg.sub }); }
    if (tg) {
      this.prompt.setPosition(Math.round(tg.x), Math.round(tg.y + Math.sin(time / 200) * 2)).setVisible(true);
      if (act) tg.use();
    } else {
      this.prompt.setVisible(false);
    }

    if (this.finale && !state.uiOpen) { this.finale = false; this.time.delayedCall(400, celebrateAll); }
  }
}
