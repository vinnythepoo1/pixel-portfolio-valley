import Phaser from 'phaser';
import { PROJECTS, SKY } from '../data/projects.js';
import { WORLD, STATION, GATE, SYSTEMS, PLANETS, PROBES, BELTS, WHALE_LINES } from './data.js';
import { genRing } from './art.js';
import { state, bus, uiBlocked, consumeTouchA } from '../state.js';
import { audio } from '../systems/Audio.js';
import { say } from '../ui/DialogBox.js';
import { openModal } from '../ui/core.js';
import { progress, unlock } from './progress.js';
import { openStation, drawMinimap } from './hud.js';

const ACCEL = 560, MAX = 210, BOOST = 390, DRAG = 1.6;
const FONT = { fontFamily: '"Pixelify Sans", monospace', fontSize: '11px', color: '#ffffff', stroke: '#05041a', strokeThickness: 3, align: 'center' };
const ASTEROID_R = [4, 7, 11];

export default class SpaceScene extends Phaser.Scene {
  constructor() { super('Space'); }

  create() {
    const cam = this.cameras.main;
    cam.setBackgroundColor('#05041a').setBounds(0, 0, WORLD.w, WORLD.h).setRoundPixels(false);

    // parallax starfields
    this.bgLayers = [['stars1', 0.06], ['stars2', 0.18], ['stars3', 0.38], ['stars4', 0.3]].map(([k, f], i) => {
      const t = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, k).setOrigin(0).setScrollFactor(0).setDepth(-1000 + i);
      t.f = f;
      return t;
    });
    this.tweens.add({ targets: this.bgLayers[3], alpha: 0.15, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // nebulae, suns and orbit rings
    const R = new Phaser.Math.RandomDataGenerator(['galaxy']);
    for (const [d, sys] of Object.entries(SYSTEMS)) {
      this.add.image(sys.x, sys.y, `neb_${d}`).setScale(4).setAlpha(0.8).setBlendMode(Phaser.BlendModes.ADD).setDepth(-900);
      this.add.image(sys.x, sys.y, 'glow').setScale(7).setTint(Phaser.Display.Color.HexStringToColor(sys.sun).color).setAlpha(0.6).setBlendMode(Phaser.BlendModes.ADD).setDepth(-500);
      this.add.sprite(sys.x, sys.y, `sun_${d}`, '0').play(`sun_${d}`).setDepth(-400);
      this.add.text(sys.x, sys.y - 60, sys.name.toUpperCase(), { ...FONT, fontSize: '12px', color: sys.color }).setOrigin(0.5, 1).setResolution(3).setDepth(-300).setAlpha(0.85);
    }
    for (let i = 0; i < 6; i++) {
      const keys = ['neb_harbor', 'neb_market', 'neb_herbal'];
      this.add.image(R.between(200, WORLD.w - 200), R.between(200, WORLD.h - 200), keys[i % 3]).setScale(R.between(2, 3)).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(-950);
    }
    const rings = this.add.graphics().setDepth(-450);

    // planets
    this.planets = PROJECTS.map((p) => {
      const pd = PLANETS[p.id], sys = SYSTEMS[p.district];
      const col = Phaser.Display.Color.HexStringToColor(sys.color).color;
      rings.fillStyle(col, 0.22);
      for (let a = 0; a < Math.PI * 2; a += 5 / pd.orbit) rings.fillRect(sys.x + Math.cos(a) * pd.orbit, sys.y + Math.sin(a) * pd.orbit, 2, 2);
      const pl = { p, pd, sys, angle: pd.start, size: pd.size, x: sys.x + Math.cos(pd.start) * pd.orbit, y: sys.y + Math.sin(pd.start) * pd.orbit };
      if (pd.ring) {
        genRing(this, `ring_${p.id}`, pd.size, pd.look.c[1]);
        pl.ringBack = this.add.image(0, 0, `ring_${p.id}_back`).setDepth(-11);
        pl.ringFront = this.add.image(0, 0, `ring_${p.id}_front`).setDepth(-9);
      }
      pl.sprite = this.add.sprite(0, 0, `pl_${p.id}`, '0').play({ key: `pl_${p.id}`, startFrame: Math.floor(Math.random() * 24) }).setDepth(-10);
      pl.halo = this.add.image(0, 0, 'glow').setScale(pd.size / 26).setTint(Phaser.Display.Color.HexStringToColor(pd.look.c[1]).color).setAlpha(0.25).setBlendMode(Phaser.BlendModes.ADD).setDepth(-12);
      pl.label = this.add.text(0, 0, '', FONT).setOrigin(0.5, 1).setResolution(3).setDepth(50);
      return pl;
    });
    this.updateLabels();
    const onProgress = () => this.updateLabels();
    bus.on('progress', onProgress);

    // station, warp gate, probes, whale
    this.station = this.add.sprite(STATION.x, STATION.y, 'station', '0').play('station').setDepth(-5);
    this.tweens.add({ targets: this.station, y: STATION.y + 4, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add.text(STATION.x, STATION.y - 40, 'HOME STATION', { ...FONT, color: '#ffd75e' }).setOrigin(0.5, 1).setResolution(3).setDepth(50);
    this.add.image(GATE.x, GATE.y, 'glow').setScale(2.6).setTint(0x9f7cff).setAlpha(0.6).setBlendMode(Phaser.BlendModes.ADD).setDepth(-6);
    this.gate = this.add.sprite(GATE.x, GATE.y, 'gate', '0').play('gate').setDepth(-5);
    this.add.text(GATE.x, GATE.y - 36, 'WARP GATE · OLD TOWN', { ...FONT, color: '#c9b8ff' }).setOrigin(0.5, 1).setResolution(3).setDepth(50);
    this.probes = PROBES.map((pr, i) => {
      const s = this.add.sprite(pr.x, pr.y, 'probe', '0').play('probe').setDepth(-5);
      this.tweens.add({ targets: s, angle: 360, duration: 14000 + i * 1500, repeat: -1 });
      return { ...pr, i, s };
    });
    this.whale = this.add.sprite(0, 0, 'whale', '0').play('whale').setDepth(-3);
    this.whaleT = 0;
    this.whaleLine = 0;

    // asteroid belts
    this.asteroids = [];
    for (const belt of BELTS) {
      for (let i = 0; i < belt.n; i++) this.spawnAsteroid(R.between(belt.x, belt.x + belt.w), R.between(belt.y, belt.y + belt.h), R.frac() < 0.7 ? 2 : 1, belt);
    }
    this.bolts = [];
    this.dust = [];

    // ship
    this.ship = { x: STATION.x, y: STATION.y + 110, vx: 0, vy: 0, energy: 1, cool: 0 };
    this.shipSprite = this.add.image(this.ship.x, this.ship.y, 'ship').setDepth(20).setRotation(-Math.PI / 2);
    this.flame = this.add.particles(0, 0, 'spark', {
      lifespan: 320, speed: { min: 4, max: 26 }, scale: { start: 1, end: 0 },
      tint: [0xffd75e, 0xff8a3a, 0xff4a2a], emitting: false,
    }).setDepth(19);
    this.boom = this.add.particles(0, 0, 'spark', {
      lifespan: 600, speed: { min: 30, max: 120 }, scale: { start: 1.2, end: 0 },
      tint: [0xa89a8c, 0xffd75e, 0xff8a3a], emitting: false,
    }).setDepth(25);

    this.prompt = this.add.image(0, 0, 'promptE').setDepth(60).setVisible(false);
    this.arrow = this.add.image(0, 0, 'arrow').setDepth(60).setVisible(false);
    this.course = null;

    cam.startFollow(this.shipSprite, true, 0.12, 0.12);
    this.applyZoom();
    this.scale.on('resize', this.applyZoom, this);

    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,ENTER,SPACE,SHIFT,J,K');
    this.time.addEvent({ delay: 17000, loop: true, callback: () => this.spawnComet() });
    this.time.addEvent({ delay: 100, loop: true, callback: () => drawMinimap({ planets: this.planets, ship: this.ship, cam: cam.worldView, course: this.course }) });

    const onCourse = (id) => { if (this.scene.isActive()) this.setCourse(id); };
    const onWarp = (id) => { if (this.scene.isActive()) this.warpTo(id); };
    bus.on('course', onCourse);
    bus.on('warp', onWarp);
    this.events.on('wake', this.onWake, this);
    this.events.once('shutdown', () => {
      bus.off('course', onCourse); bus.off('warp', onWarp); bus.off('progress', onProgress);
      this.scale.off('resize', this.applyZoom, this);
    });

    this.lastTarget = null;
    this.lastSystem = null;
    this.hotToast = 0;
    this.thudAt = 0;
    this.lastEnergy = -1;
    bus.emit('mode', 'space');
  }

  applyZoom() {
    const w = this.scale.width, h = this.scale.height;
    this.cameras.main.setZoom(Math.max(1, Math.min(h / 330, w / 440)));
    for (const t of this.bgLayers) t.setSize(w, h);
  }

  updateLabels() {
    for (const pl of this.planets) {
      const n = progress.count('crystal', `${pl.p.id}:`);
      pl.label.setText(`${pl.pd.surface.name}\n${'◆'.repeat(n)}${'◇'.repeat(4 - n)}`);
      pl.label.setColor(n === 4 ? '#ffd75e' : '#ffffff');
    }
  }

  // ---------------------------------------------------------------- spawners
  spawnAsteroid(x, y, size, belt, vx, vy) {
    const r = ASTEROID_R[size];
    const s = this.add.image(x, y, `a${size}_${Math.random() < 0.5 ? 0 : 1}`).setDepth(5).setRotation(Math.random() * 6);
    this.asteroids.push({
      s, x, y, r, size, belt, hp: size + 1,
      vx: vx ?? Phaser.Math.Between(-14, 14), vy: vy ?? Phaser.Math.Between(-14, 14),
      spin: Phaser.Math.FloatBetween(-1, 1),
    });
  }

  spawnComet() {
    const v = this.cameras.main.worldView;
    const fromLeft = Math.random() < 0.5;
    const x = fromLeft ? v.x - 40 : v.right + 40, y = v.y + Math.random() * v.height * 0.5;
    const head = this.add.image(x, y, 'glow').setScale(0.35).setTint(0xcfeaff).setBlendMode(Phaser.BlendModes.ADD).setDepth(15);
    const tail = this.add.particles(0, 0, 'spark', {
      lifespan: 900, speed: { min: 2, max: 12 }, scale: { start: 1, end: 0 }, alpha: { start: 0.9, end: 0 },
      tint: [0xcfeaff, 0x9fd0ff, 0xffffff], frequency: 18, follow: head,
    }).setDepth(14);
    this.tweens.add({
      targets: head, x: fromLeft ? v.right + 200 : v.x - 200, y: y + v.height * 0.6, duration: 5000,
      onComplete: () => { tail.stop(); head.destroy(); this.time.delayedCall(1000, () => tail.destroy()); },
    });
  }

  // ---------------------------------------------------------------- navigation
  setCourse(id) {
    const pl = this.planets.find((x) => x.p.id === id);
    if (!pl) return;
    this.course = id;
    bus.emit('toast', `🧭 Course set for Planet ${pl.pd.surface.name}. Autopilot engaged. Steer to take over.`);
  }

  warpTo(id) {
    const pl = this.planets.find((x) => x.p.id === id);
    if (!pl) return;
    audio.sfx('warp');
    this.cameras.main.flash(400, 200, 180, 255);
    this.course = null;
    this.placeNear(pl);
  }

  placeNear(pl) {
    const dx = this.ship.x - pl.x, dy = this.ship.y - pl.y;
    const d = Math.hypot(dx, dy) || 1;
    const dist = pl.size / 2 + 55;
    this.ship.x = pl.x + (dx / d) * dist;
    this.ship.y = pl.y + (dy / d) * dist;
    this.ship.vx = this.ship.vy = 0;
    this.shipSprite.setPosition(this.ship.x, this.ship.y);
    this.cameras.main.centerOn(this.ship.x, this.ship.y);
  }

  land(pl) {
    if (this.landing) return;
    this.landing = true;
    this.course = null;
    bus.emit('target', null);
    this.prompt.setVisible(false);
    audio.sfx('warp');
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.pan(pl.x, pl.y, 700, 'Cubic.easeIn');
    cam.zoomTo(cam.zoom * 3, 700, 'Cubic.easeIn');
    cam.fadeOut(700, 0, 0, 0);
    cam.once('camerafadeoutcomplete', () => {
      this.scene.launch('Planet', { id: pl.p.id });
      this.scene.sleep();
    });
  }

  onWake(sys, data) {
    this.landing = false;
    this.input.keyboard.resetKeys();
    this.applyZoom();
    const cam = this.cameras.main;
    const pl = this.planets.find((x) => x.p.id === data?.from);
    if (pl) this.placeNear(pl);
    cam.startFollow(this.shipSprite, true, 0.12, 0.12);
    cam.fadeIn(400, 0, 0, 0);
    bus.emit('mode', 'space');
    if (data?.then?.warp) this.warpTo(data.then.warp);
    if (data?.then?.course) this.setCourse(data.then.course);
  }

  confirmGate() {
    if (this.gateOpen) return;
    this.gateOpen = true;
    openModal(`
      <div class="kicker">🌀 Warp gate</div>
      <h2>Warp to the old pixel town?</h2>
      <p>The first version of this portfolio: a cozy fantasy town where every building is a project.</p>
      <div class="actions"><a class="btn btn-primary" href="town.html">🏘 Warp to the town</a><button class="btn" data-close>Stay in space</button></div>`, {
      onClose: () => { this.ship.vx = -120; this.ship.vy = -60; },
    });
  }

  // ---------------------------------------------------------------- loop
  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    const k = this.keys, t = state.touch;
    const JD = Phaser.Input.Keyboard.JustDown;
    const pressedE = [JD(k.E), JD(k.ENTER)].some(Boolean);
    const touchA = consumeTouchA();
    const blocked = uiBlocked() || this.landing;
    let ix = 0, iy = 0, fire = false, boost = false, act = false;
    if (!blocked) {
      ix = (k.RIGHT.isDown || k.D.isDown || t.right ? 1 : 0) - (k.LEFT.isDown || k.A.isDown || t.left ? 1 : 0);
      iy = (k.DOWN.isDown || k.S.isDown || t.down ? 1 : 0) - (k.UP.isDown || k.W.isDown || t.up ? 1 : 0);
      fire = k.SPACE.isDown || k.J.isDown || state.touchB;
      boost = k.SHIFT.isDown || k.K.isDown;
      act = pressedE || touchA;
    }
    const s = this.ship;

    // autopilot towards the chosen planet until the pilot steers
    if (ix || iy) this.course = null;
    const coursePl = this.course && this.planets.find((x) => x.p.id === this.course);
    if (coursePl && !blocked) {
      const dx = coursePl.x - s.x, dy = coursePl.y - s.y, d = Math.hypot(dx, dy);
      const stop = coursePl.size / 2 + 60;
      if (d < stop) {
        this.course = null;
        bus.emit('toast', `🪐 Arrived at Planet ${coursePl.pd.surface.name}. Press E to land!`);
      } else {
        const want = Math.min(MAX * 1.4, (d - stop) * 1.5 + 30);
        s.vx += ((dx / d) * want - s.vx) * Math.min(1, dt * 2.5);
        s.vy += ((dy / d) * want - s.vy) * Math.min(1, dt * 2.5);
      }
    }

    // gravity: suns and planets pull the ship, so you can slingshot past them
    if (!coursePl) {
      for (const sys of Object.values(SYSTEMS)) this.pull(s, sys.x, sys.y, 560, 1.3e6, 90, dt, 130);
      for (const pl of this.planets) this.pull(s, pl.x, pl.y, pl.size * 3.2, pl.size * 5200, 70, dt);
    }

    // flight
    const thrusting = !!(ix || iy) || !!coursePl;
    if (ix || iy) {
      const len = Math.hypot(ix, iy);
      s.vx += (ix / len) * ACCEL * dt;
      s.vy += (iy / len) * ACCEL * dt;
    } else if (!coursePl) {
      const f = Math.exp(-DRAG * dt);
      s.vx *= f; s.vy *= f;
    }
    const boosting = boost && (ix || iy) && s.energy > 0.02;
    s.energy = Phaser.Math.Clamp(s.energy + (boosting ? -0.45 : 0.22) * dt, 0, 1);
    const cap = boosting ? BOOST : coursePl ? MAX * 1.4 : MAX;
    const sp = Math.hypot(s.vx, s.vy);
    if (sp > cap) { s.vx *= cap / sp; s.vy *= cap / sp; }
    s.x += s.vx * dt; s.y += s.vy * dt;
    // safety net: never let a bad number (NaN) blank the whole screen
    if (![s.x, s.y, s.vx, s.vy].every(Number.isFinite)) { s.x = STATION.x; s.y = STATION.y + 110; s.vx = 0; s.vy = 0; }
    if (s.x < 20 || s.x > WORLD.w - 20) { s.vx *= -0.5; s.x = Phaser.Math.Clamp(s.x, 20, WORLD.w - 20); }
    if (s.y < 20 || s.y > WORLD.h - 20) { s.vy *= -0.5; s.y = Phaser.Math.Clamp(s.y, 20, WORLD.h - 20); }
    if (Math.abs(s.energy - this.lastEnergy) > 0.01) { this.lastEnergy = s.energy; bus.emit('energy', s.energy); }

    const sprite = this.shipSprite;
    const speed = Math.hypot(s.vx, s.vy);
    if (speed > 12) sprite.rotation = Phaser.Math.Angle.RotateTo(sprite.rotation, Math.atan2(s.vy, s.vx), 8 * dt);
    else if (ix || iy) sprite.rotation = Phaser.Math.Angle.RotateTo(sprite.rotation, Math.atan2(iy, ix), 8 * dt);
    sprite.setPosition(s.x, s.y);
    if (thrusting) {
      const bx = s.x - Math.cos(sprite.rotation) * 12, by = s.y - Math.sin(sprite.rotation) * 12;
      this.flame.emitParticleAt(bx, by, boosting ? 3 : 1);
    }

    // shooting
    s.cool -= dt;
    if (fire && s.cool <= 0) {
      s.cool = 0.16;
      const a = sprite.rotation, cx = Math.cos(a), cy = Math.sin(a);
      const b = this.add.image(s.x + cx * 14, s.y + cy * 14, 'bolt').setRotation(a).setDepth(18);
      this.bolts.push({ s: b, x: b.x, y: b.y, vx: cx * 560 + s.vx, vy: cy * 560 + s.vy, life: 0.9 });
      s.vx -= cx * 6; s.vy -= cy * 6; // recoil
      audio.sfx('pew');
    }
    for (const b of this.bolts) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      b.s.setPosition(b.x, b.y);
    }

    // planets orbit; bump the ship out of planets and suns
    for (const pl of this.planets) {
      pl.angle += pl.pd.speed * dt;
      pl.x = pl.sys.x + Math.cos(pl.angle) * pl.pd.orbit;
      pl.y = pl.sys.y + Math.sin(pl.angle) * pl.pd.orbit;
      pl.sprite.setPosition(pl.x, pl.y);
      pl.halo.setPosition(pl.x, pl.y);
      pl.ringBack?.setPosition(pl.x, pl.y);
      pl.ringFront?.setPosition(pl.x, pl.y);
      pl.label.setPosition(Math.round(pl.x), Math.round(pl.y - pl.size / 2 - 6));
      this.pushOut(pl.x, pl.y, pl.size / 2 + 8);
    }
    for (const sys of Object.values(SYSTEMS)) {
      if (this.pushOut(sys.x, sys.y, 44) && time > this.hotToast) {
        this.hotToast = time + 4000;
        bus.emit('toast', '🔥 Too hot! Suns are for looking at, not landing on.');
      }
    }

    // asteroids: drift, stay loosely inside their belt, collide with each other and the ship
    const SHIP_M = 3;
    for (const a of this.asteroids) {
      a.x += a.vx * dt; a.y += a.vy * dt;
      const bt = a.belt;
      if (a.x < bt.x) a.vx += 30 * dt; else if (a.x > bt.x + bt.w) a.vx -= 30 * dt;
      if (a.y < bt.y) a.vy += 30 * dt; else if (a.y > bt.y + bt.h) a.vy -= 30 * dt;
      const sp = Math.hypot(a.vx, a.vy);
      if (sp > 90) { a.vx *= Math.exp(-0.8 * dt); a.vy *= Math.exp(-0.8 * dt); }
      a.spin *= Math.exp(-0.15 * dt);
      a.s.setPosition(a.x, a.y).setRotation(a.s.rotation + a.spin * dt);
    }
    const list = this.asteroids;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r;
        if (Math.abs(dx) > rr || Math.abs(dy) > rr) continue;
        const d = Math.hypot(dx, dy);
        if (d >= rr || d === 0) continue;
        this.collide(a, b, dx / d, dy / d, rr - d, 0.85);
      }
      // ship vs asteroid (the ship is a circle of radius 8)
      const dx = a.x - s.x, dy = a.y - s.y, d = Math.hypot(dx, dy);
      if (d < a.r + 8 && d > 0) {
        const nx = dx / d, ny = dy / d;
        const impact = (s.vx - a.vx) * nx + (s.vy - a.vy) * ny;
        const ship = { x: s.x, y: s.y, vx: s.vx, vy: s.vy, m: SHIP_M };
        this.collide(ship, a, nx, ny, a.r + 8 - d, 0.6);
        s.x = ship.x; s.y = ship.y; s.vx = ship.vx; s.vy = ship.vy;
        if (impact > 230 && a.size < 2) { a.hp = 0; a.hit = true; this.cameras.main.shake(140, 0.006); }
        else if (time > this.thudAt && impact > 20) { this.thudAt = time + 250; audio.sfx('thud'); this.cameras.main.shake(90, Math.min(0.006, impact / 40000)); }
      }
      for (const b of this.bolts) {
        if (b.life <= 0) continue;
        if (Math.hypot(b.x - a.x, b.y - a.y) < a.r + 3) {
          b.life = 0; a.hp--; a.hit = true;
          const m = this.massOf(a);
          a.vx += (b.vx - s.vx) * 0.06 / m * 4; a.vy += (b.vy - s.vy) * 0.06 / m * 4;
          a.spin += (Math.random() - 0.5) * 3 / m;
        }
      }
    }
    for (const a of this.asteroids.filter((x) => x.hit)) {
      a.hit = false;
      if (a.hp > 0) { a.s.setTintFill(0xffffff); this.time.delayedCall(60, () => a.s.active && a.s.clearTint()); continue; }
      this.breakAsteroid(a);
    }
    this.asteroids = this.asteroids.filter((a) => a.hp > 0);
    this.bolts = this.bolts.filter((b) => { if (b.life > 0) return true; b.s.destroy(); return false; });

    // stardust pickups drift toward the ship
    for (const d of this.dust) {
      const dx = s.x - d.x, dy = s.y - d.y, dist = Math.hypot(dx, dy);
      if (dist < 110) { d.vx += (dx / dist) * 600 * dt; d.vy += (dy / dist) * 600 * dt; }
      d.vx *= Math.exp(-1.5 * dt); d.vy *= Math.exp(-1.5 * dt);
      d.x += d.vx * dt; d.y += d.vy * dt;
      d.s.setPosition(d.x, d.y);
      if (dist < 12) { d.got = true; d.s.destroy(); progress.addDust(1); audio.sfx('blip'); }
    }
    this.dust = this.dust.filter((d) => !d.got);

    // the whale swims a big loop around the galaxy
    this.whaleT += dt * 0.012;
    const wx = 2400 + Math.cos(this.whaleT) * 1900, wy = 1900 + Math.sin(this.whaleT * 1.3) * 1500;
    this.whale.setFlipX(wx > this.whale.x);
    this.whale.setPosition(wx, wy);

    // warp gate
    if (Math.hypot(s.x - GATE.x, s.y - GATE.y) < 26) this.confirmGate();
    else if (Math.hypot(s.x - GATE.x, s.y - GATE.y) > 60) this.gateOpen = false;

    // what can we interact with?
    const target = blocked ? null : this.findTarget();
    const key = target ? target.key : null;
    if (key !== this.lastTarget) { this.lastTarget = key; bus.emit('target', target && { action: target.action, name: target.name, sub: target.sub }); }
    if (target) {
      this.prompt.setPosition(Math.round(target.x), Math.round(target.y + Math.sin(time / 200) * 2)).setVisible(true);
      if (act) target.use();
    } else {
      this.prompt.setVisible(false);
    }

    // system banner
    const inSys = Object.entries(SYSTEMS).find(([, sys]) => Math.hypot(s.x - sys.x, s.y - sys.y) < 720);
    const sysKey = inSys ? inSys[0] : null;
    if (sysKey !== this.lastSystem) {
      this.lastSystem = sysKey;
      if (inSys && state.started) bus.emit('banner', { title: inSys[1].name, sub: inSys[1].blurb });
    }

    // arrow toward the course target when it's off screen
    const v = this.cameras.main.worldView;
    if (coursePl && !v.contains(coursePl.x, coursePl.y)) {
      const ang = Math.atan2(coursePl.y - s.y, coursePl.x - s.x);
      const ax = Phaser.Math.Clamp(s.x + Math.cos(ang) * 1000, v.x + 14, v.right - 14);
      const ay = Phaser.Math.Clamp(s.y + Math.sin(ang) * 1000, v.y + 14, v.bottom - 14);
      this.arrow.setPosition(ax, ay).setRotation(ang).setVisible(true);
    } else {
      this.arrow.setVisible(false);
    }

    const cam = this.cameras.main;
    for (const l of this.bgLayers) { l.tilePositionX = cam.scrollX * l.f; l.tilePositionY = cam.scrollY * l.f; }
  }

  pushOut(x, y, r) {
    const s = this.ship, dx = s.x - x, dy = s.y - y, d = Math.hypot(dx, dy);
    if (d >= r || d === 0) return false;
    s.x = x + (dx / d) * r; s.y = y + (dy / d) * r;
    const vn = (s.vx * dx + s.vy * dy) / d;
    if (vn < 0) { s.vx -= 1.4 * vn * (dx / d); s.vy -= 1.4 * vn * (dy / d); }
    return true;
  }

  // Accelerates body b toward (x, y) inside `range`, with an inverse-square pull capped at `max`.
  // Inside `calm` the pull fades out, so a parked ship never slides into a sun.
  pull(b, x, y, range, k, max, dt, calm = 0) {
    const dx = x - b.x, dy = y - b.y, d2 = dx * dx + dy * dy;
    if (d2 > range * range || d2 < 1) return;
    if (!Number.isFinite(d2)) return;
    const d = Math.sqrt(d2), acc = Math.min(max, k / d2) * (1 - d / range) * (calm ? Math.min(1, Math.max(0, (d - calm * 0.6) / (calm * 0.4))) : 1);
    b.vx += (dx / d) * acc * dt; b.vy += (dy / d) * acc * dt;
  }

  massOf(o) { return o.m ?? (o.r * o.r) / 16; }

  // Elastic-ish collision between two circles along normal (nx, ny) pointing from a to b.
  collide(a, b, nx, ny, overlap, restitution) {
    const ma = this.massOf(a), mb = this.massOf(b), inv = 1 / ma + 1 / mb;
    a.x -= nx * overlap * (1 / ma) / inv; a.y -= ny * overlap * (1 / ma) / inv;
    b.x += nx * overlap * (1 / mb) / inv; b.y += ny * overlap * (1 / mb) / inv;
    const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (rel >= 0) return;
    const j = (-(1 + restitution) * rel) / inv;
    a.vx -= (j / ma) * nx; a.vy -= (j / ma) * ny;
    b.vx += (j / mb) * nx; b.vy += (j / mb) * ny;
    // glancing hits set rocks spinning
    const tang = (b.vx - a.vx) * -ny + (b.vy - a.vy) * nx;
    if (a.spin !== undefined) a.spin += tang * 0.004;
    if (b.spin !== undefined) b.spin -= tang * 0.004;
  }

  breakAsteroid(a) {
    a.s.destroy();
    this.boom.explode(a.size * 6 + 6, a.x, a.y);
    // shockwave pushes nearby rocks and the ship
    const blast = 60 + a.size * 30;
    for (const o of [...this.asteroids, this.ship]) {
      if (o === a) continue;
      const dx = o.x - a.x, dy = o.y - a.y, d = Math.hypot(dx, dy);
      if (d > blast || d < 1) continue;
      const f = (1 - d / blast) * 90 / (o.r ? this.massOf(o) : 3);
      o.vx += (dx / d) * f; o.vy += (dy / d) * f;
    }
    audio.sfx('boom');
    if (a.size > 0) {
      for (let i = 0; i < 2; i++) {
        const ang = Math.random() * Math.PI * 2;
        this.spawnAsteroid(a.x + Math.cos(ang) * a.r * 0.6, a.y + Math.sin(ang) * a.r * 0.6, a.size - 1, a.belt, Math.cos(ang) * 30 + a.vx, Math.sin(ang) * 30 + a.vy);
      }
    }
    for (let i = 0; i < a.size + 2; i++) {
      const ang = Math.random() * Math.PI * 2, spd = 30 + Math.random() * 50;
      const d = this.add.image(a.x, a.y, 'dust').setDepth(17);
      this.tweens.add({ targets: d, angle: 360, duration: 1200, repeat: -1 });
      this.dust.push({ s: d, x: a.x, y: a.y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd });
    }
  }

  findTarget() {
    const s = this.ship;
    let best = null, bestD = Infinity;
    const consider = (d, range, t) => { if (d < range && d < bestD) { bestD = d; best = t; } };
    for (const pl of this.planets) {
      const n = progress.count('crystal', `${pl.p.id}:`);
      consider(Math.hypot(s.x - pl.x, s.y - pl.y) - pl.size / 2, 70, {
        key: `pl:${pl.p.id}`, action: 'Land on', name: `Planet ${pl.pd.surface.name}`, sub: `${SKY[pl.p.id].name} · crystals ${n}/4`,
        x: pl.x, y: pl.y - pl.size / 2 - 34, use: () => this.land(pl),
      });
    }
    consider(Math.hypot(s.x - STATION.x, s.y - STATION.y), 95, {
      key: 'station', action: 'Dock at', name: 'Home Station', sub: 'About me · mission board · logbook',
      x: STATION.x, y: STATION.y - 56, use: () => { audio.sfx('door'); openStation(); },
    });
    for (const pr of this.probes) {
      consider(Math.hypot(s.x - pr.x, s.y - pr.y), 48, {
        key: `probe:${pr.i}`, action: 'Read', name: `Probe log ${pr.i + 1}`, sub: progress.has('log', String(pr.i)) ? 'already read' : 'new!',
        x: pr.x, y: pr.y - 20, use: () => this.readProbe(pr),
      });
    }
    consider(Math.hypot(s.x - this.whale.x, s.y - this.whale.y), 70, {
      key: 'whale', action: 'Talk to', name: 'the Space Whale', sub: '',
      x: this.whale.x, y: this.whale.y - 30, use: () => this.talkWhale(),
    });
    return best;
  }

  readProbe(pr) {
    audio.sfx('chime');
    say([pr.text], { name: `Probe log ${pr.i + 1} of 6` });
    if (progress.add('log', String(pr.i)) && progress.count('log') === PROBES.length) unlock('archivist');
  }

  talkWhale() {
    audio.sfx('purr');
    const lines = WHALE_LINES[this.whaleLine % WHALE_LINES.length];
    this.whaleLine++;
    say(lines, { name: 'Space Whale', portrait: this.textures.getBase64('whale', '0') });
    unlock('whale');
  }
}
