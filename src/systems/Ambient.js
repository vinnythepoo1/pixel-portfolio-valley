import Phaser from 'phaser';
import { T } from '../art/sprites.js';
import { state } from '../state.js';

const DEPTH_OVERLAY = 10000;
const BUTTERFLY_TINTS = [0xffe17a, 0xffffff, 0x9fd0ff, 0xffa8d0, 0xc8f08a];

// Everything that makes the town feel alive without the player doing anything.
export default class Ambient {
  constructor(scene, { layer, grassSpots, chimneys, fountain }) {
    this.scene = scene;
    this.night = 0;

    // water shimmer: swap the two water tiles back and forth
    let phase = 0;
    scene.time.addEvent({
      delay: 650, loop: true,
      callback: () => {
        if (phase) layer.replaceByIndex(T.WATER_B, T.WATER_A); else layer.replaceByIndex(T.WATER_A, T.WATER_B);
        phase ^= 1;
      },
    });

    // chimney smoke
    for (const c of chimneys) {
      scene.add.particles(c.x, c.y, 'puff', {
        lifespan: 2600, frequency: 420,
        speedY: { min: -16, max: -9 }, speedX: { min: -2, max: 7 },
        scale: { start: 0.5, end: 1.5 }, alpha: { start: 0.55, end: 0 },
      }).setDepth(c.depth);
    }

    // fountain droplets
    if (fountain) {
      scene.add.particles(fountain.x, fountain.y, 'dot', {
        lifespan: 700, frequency: 90, quantity: 1,
        speedX: { min: -22, max: 22 }, speedY: { min: -40, max: -20 }, gravityY: 90,
        scale: { start: 0.8, end: 0.3 }, tint: [0xcfeaf9, 0xffffff], alpha: { start: 0.9, end: 0.2 },
      }).setDepth(fountain.depth);
    }

    // butterflies by day
    const pick = () => grassSpots[Math.floor(Math.random() * grassSpots.length)];
    this.butterflies = [];
    for (let i = 0; i < 14 && grassSpots.length; i++) {
      const [tx, ty] = pick();
      const b = scene.add.sprite(tx * 16 + 8, ty * 16, 'butterfly', '0').setDepth(9000).setTint(Phaser.Utils.Array.GetRandom(BUTTERFLY_TINTS));
      b.play({ key: 'butterfly', startFrame: i % 2 });
      b.home = { x: b.x, y: b.y };
      this.flutter(b);
      this.butterflies.push(b);
    }

    // fireflies by night
    this.fireflies = [];
    for (let i = 0; i < 32 && grassSpots.length; i++) {
      const [tx, ty] = pick();
      const f = scene.add.image(tx * 16 + 8, ty * 16 + 4, 'firefly').setDepth(DEPTH_OVERLAY + 1).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
      f.phase = Math.random() * Math.PI * 2;
      scene.tweens.add({
        targets: f, x: f.x + Phaser.Math.Between(-24, 24), y: f.y + Phaser.Math.Between(-16, 16),
        duration: Phaser.Math.Between(2500, 5000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      this.fireflies.push(f);
    }

    // birds on the plaza, gulls on the beach
    this.birds = [];
    const birdSpots = [[27, 21, 0xb08860], [28, 22, 0xb08860], [35, 21, 0xb08860], [34, 28, 0xa07850], [26, 24, 0xb08860],
      [15, 40, null], [16, 39, null], [40, 39, null], [46, 40, null], [47, 40, null]];
    for (const [tx, ty, tint] of birdSpots) {
      const b = scene.add.sprite(tx * 16 + Phaser.Math.Between(2, 14), ty * 16 + Phaser.Math.Between(6, 14), 'bird', '0');
      if (tint) b.setTint(tint);
      b.setDepth(b.y).setFlipX(Math.random() < 0.5);
      b.play({ key: 'bird-peck', startFrame: Phaser.Math.Between(0, 4) });
      b.home = { x: b.x, y: b.y };
      b.flying = false;
      this.birds.push(b);
    }

    // weather, rolled once per visit
    const roll = Math.random();
    state.weather = roll < 0.55 ? 'clear' : roll < 0.78 ? 'rain' : 'leaves';
    if (state.weather === 'rain') {
      this.weather = scene.add.particles(0, 0, 'rain', {
        x: { min: -40, max: 760 }, y: -10, lifespan: 2400, frequency: 18, quantity: 2,
        speedY: { min: 280, max: 340 }, speedX: { min: -50, max: -30 }, alpha: { start: 0.65, end: 0.25 },
      }).setDepth(DEPTH_OVERLAY + 2);
    } else if (state.weather === 'leaves') {
      this.weather = scene.add.particles(0, 0, 'leaf', {
        x: { min: -40, max: 760 }, y: -10, lifespan: 9000, frequency: 260, quantity: 1,
        speedY: { min: 18, max: 34 }, speedX: { min: 8, max: 30 }, rotate: { start: 0, end: 360 },
        tint: [0xd9873a, 0xc0453a, 0xe2b23a, 0xa0643a],
      }).setDepth(DEPTH_OVERLAY + 2);
    }
  }

  flutter(b) {
    if (!b.active) return;
    this.scene.tweens.add({
      targets: b,
      x: b.home.x + Phaser.Math.Between(-40, 40),
      y: b.home.y + Phaser.Math.Between(-30, 20),
      duration: Phaser.Math.Between(1800, 3600),
      ease: 'Sine.easeInOut',
      onComplete: () => this.flutter(b),
    });
  }

  scareBirds(px, py, radius = 34) {
    for (const b of this.birds) {
      if (b.flying || Phaser.Math.Distance.Between(px, py, b.x, b.y) > radius) continue;
      b.flying = true;
      b.play('bird-fly');
      b.setFlipX(b.x < px);
      b.setDepth(9500);
      this.scene.tweens.add({
        targets: b,
        x: b.x + (b.x < px ? -1 : 1) * Phaser.Math.Between(80, 160),
        y: b.y - Phaser.Math.Between(140, 220),
        alpha: 0,
        duration: Phaser.Math.Between(1400, 2000),
        ease: 'Quad.easeIn',
        onComplete: () => {
          this.scene.time.delayedCall(Phaser.Math.Between(9000, 16000), () => {
            b.setPosition(b.home.x, b.home.y - 40).setAlpha(0).setDepth(b.home.y);
            this.scene.tweens.add({
              targets: b, y: b.home.y, alpha: 1, duration: 900, ease: 'Quad.easeOut',
              onComplete: () => { b.flying = false; b.play('bird-peck'); },
            });
          });
        },
      });
    }
  }

  update(time, night, player) {
    this.night = night;
    const dayAlpha = Phaser.Math.Clamp(1 - night * 1.4, 0, 1);
    for (const b of this.butterflies) b.setAlpha(dayAlpha);
    for (const f of this.fireflies) f.setAlpha(night * (0.55 + 0.45 * Math.sin(time / 300 + f.phase)));
    this.scareBirds(player.x, player.y);
    if (this.weather) {
      const v = this.scene.cameras.main.worldView;
      this.weather.setPosition(v.x, v.y);
    }
  }
}
