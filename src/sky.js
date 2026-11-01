import Phaser from 'phaser';
import { W, H } from './ui.js';

// 날씨에 맞춘 하늘 배경: 그라데이션 + 해/달/별 + 구름 + 비/눈/번개/안개
const SKY = {
  clear: { day: [0x2f6fd0, 0x9fd3ff], night: [0x050817, 0x1b2550] },
  partly: { day: [0x3a78cf, 0xb3d7f5], night: [0x070b1d, 0x222b4d] },
  cloudy: { day: [0x55657a, 0xa9b4c2], night: [0x0d1018, 0x2a303c] },
  fog: { day: [0x8d949c, 0xc9ced3], night: [0x1a1d22, 0x3a3f46] },
  rain: { day: [0x3c4a5c, 0x6f7f91], night: [0x0a0e15, 0x232c38] },
  snow: { day: [0x8fa3b8, 0xdfe8f1], night: [0x141a26, 0x3c475a] },
  storm: { day: [0x1b2230, 0x3a4352], night: [0x05070c, 0x1a1f29] },
};
const CLOUDS = { clear: 0, partly: 3, cloudy: 7, fog: 2, rain: 6, snow: 5, storm: 7 };

export class Sky {
  constructor(scene, w, depth = -100) {
    this.scene = scene;
    this.w = w;
    const day = w.isDay;
    const c = scene.add.container(0, 0).setDepth(depth);
    this.c = c;

    // 그라데이션
    const [top, bottom] = SKY[w.kind][day ? 'day' : 'night'];
    const g = scene.add.graphics();
    const a = Phaser.Display.Color.ValueToColor(top), b = Phaser.Display.Color.ValueToColor(bottom);
    for (let i = 0; i < 60; i++) {
      const k = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, 59, i);
      g.fillStyle(Phaser.Display.Color.GetColor(k.r, k.g, k.b), 1).fillRect(0, (H / 60) * i, W, H / 60 + 1);
    }
    c.add(g);

    // 밤하늘 별
    if (!day && (w.kind === 'clear' || w.kind === 'partly')) {
      for (let i = 0; i < 70; i++) {
        const s = scene.add.circle(Math.random() * W, Math.random() * H * 0.75, Math.random() * 1.3 + 0.4, 0xffffff, 0.8);
        scene.tweens.add({ targets: s, alpha: 0.15, yoyo: true, repeat: -1, duration: 900 + Math.random() * 2200, delay: Math.random() * 2000 });
        c.add(s);
      }
    }

    // 해 / 달
    if (w.kind === 'clear' || w.kind === 'partly') {
      const glow = scene.add.graphics();
      const col = day ? 0xfff1a8 : 0xe9ecff;
      for (let i = 0; i < 20; i++) glow.fillStyle(col, 0.025).fillCircle(790, 104, 30 + i * 6);
      const orb = scene.add.circle(790, 104, day ? 38 : 28, day ? 0xfff6c8 : 0xf4f1e1);
      c.add([glow, orb]);
      scene.tweens.add({ targets: glow, scale: 1.05, yoyo: true, repeat: -1, duration: 3000, ease: 'Sine.easeInOut' });
    }

    // 구름
    this.clouds = [];
    const cloudCol = w.kind === 'storm' || w.kind === 'rain' ? 0x5d6878 : 0xffffff;
    const cloudA = day ? 0.85 : 0.22;
    for (let i = 0; i < CLOUDS[w.kind]; i++) {
      const cg = scene.add.graphics();
      const s = 0.6 + Math.random() * 0.9;
      cg.fillStyle(cloudCol, cloudA);
      [[0, 0, 120, 44], [-38, 8, 80, 34], [40, 10, 90, 36], [6, -16, 76, 40]].forEach(([x, y, ww, hh]) => cg.fillEllipse(x * s, y * s, ww * s, hh * s));
      cg.setPosition(Math.random() * (W + 200) - 100, 50 + Math.random() * 200);
      c.add(cg);
      this.clouds.push({ g: cg, v: 6 + Math.random() * 14 });
    }

    // 안개 띠
    this.fog = [];
    if (w.kind === 'fog') {
      for (let i = 0; i < 5; i++) {
        const f = scene.add.ellipse(Math.random() * W, 160 + i * 80, 900, 90, 0xffffff, 0.14);
        c.add(f);
        this.fog.push({ o: f, v: (i % 2 ? 1 : -1) * (8 + Math.random() * 8) });
      }
    }

    // 비 / 눈
    this.drops = [];
    this.pg = scene.add.graphics();
    c.add(this.pg);
    const n = w.kind === 'snow' ? 110 : w.kind === 'rain' || w.kind === 'storm' ? 160 : 0;
    for (let i = 0; i < n; i++) this.drops.push({ x: Math.random() * W, y: Math.random() * H, v: 0, s: Math.random() });

    // 번개
    if (w.kind === 'storm') {
      this.flash = scene.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0);
      c.add(this.flash);
      this.bolt = scene.time.addEvent({ delay: 3500, loop: true, callback: () => {
        if (Math.random() < 0.7) scene.tweens.add({ targets: this.flash, alpha: { from: 0.55, to: 0 }, duration: 350, ease: 'Cubic.easeOut' });
      } });
    }
  }

  update(dt) {
    for (const cl of this.clouds) {
      cl.g.x += cl.v * dt;
      if (cl.g.x > W + 140) cl.g.x = -140;
    }
    for (const f of this.fog) {
      f.o.x += f.v * dt;
      if (f.o.x > W + 450) f.o.x = -450;
      if (f.o.x < -450) f.o.x = W + 450;
    }
    if (!this.drops.length) return;
    const g = this.pg;
    g.clear();
    const snow = this.w.kind === 'snow';
    for (const d of this.drops) {
      if (snow) {
        d.y += (30 + d.s * 40) * dt;
        d.x += Math.sin((d.y + d.s * 100) / 40) * 0.4;
        g.fillStyle(0xffffff, 0.5 + d.s * 0.4).fillCircle(d.x, d.y, 1.5 + d.s * 2);
      } else {
        d.y += (520 + d.s * 300) * dt;
        d.x -= 60 * dt;
        g.lineStyle(1, 0xcfe0ff, 0.25 + d.s * 0.35).lineBetween(d.x, d.y, d.x + 3, d.y - 14);
      }
      if (d.y > H + 16) { d.y = -16; d.x = Math.random() * (W + 60); }
    }
  }

  destroy() { this.bolt?.remove(); this.c.destroy(); }
}
