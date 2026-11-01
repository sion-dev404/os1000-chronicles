import Phaser from 'phaser';
import { sfx } from './audio.js';

export const W = 960;
export const H = 540;
export const FONT = "'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR','Segoe UI Emoji','Apple Color Emoji',sans-serif";

export function T(scene, x, y, str, size = 24, color = '#ffffff', o = {}) {
  const t = scene.add.text(x, y, str, {
    fontFamily: FONT,
    fontSize: size + 'px',
    color,
    align: o.align || 'center',
    fontStyle: o.bold ? 'bold' : 'normal',
    stroke: o.stroke || undefined,
    strokeThickness: o.st || 0,
    lineSpacing: o.ls || 0,
    wordWrap: o.w ? { width: o.w } : undefined,
  });
  t.setOrigin(o.ox ?? 0.5, o.oy ?? 0.5);
  if (o.depth !== undefined) t.setDepth(o.depth);
  return t;
}

// 세로 띠를 쌓아서 만드는 그라데이션 배경 (렌더러 종류와 무관하게 동작)
export function gradientBg(scene, c1, c2, depth = -100) {
  const g = scene.add.graphics().setDepth(depth);
  const a = Phaser.Display.Color.ValueToColor(c1);
  const b = Phaser.Display.Color.ValueToColor(c2);
  const bands = 36;
  for (let i = 0; i < bands; i++) {
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(a, b, bands - 1, i);
    g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
    g.fillRect(0, (H / bands) * i, W, H / bands + 1);
  }
  return g;
}

export function button(scene, x, y, w, h, label, cb, color = 0x2a6cff, size = 24, depth = 50) {
  const r = scene.add.rectangle(x, y, w, h, color).setStrokeStyle(3, 0xffffff).setInteractive({ useHandCursor: true });
  const t = T(scene, x, y, label, size, '#ffffff', { bold: true });
  r.on('pointerover', () => { r.setScale(1.05); t.setScale(1.05); });
  r.on('pointerout', () => { r.setScale(1); t.setScale(1); });
  r.on('pointerdown', () => { sfx.click(); cb(); });
  r.label = t;
  r.setDepth(depth); t.setDepth(depth + 1);
  return r;
}

// 위/아래로 흘러가는 문자 비 (타이틀·컷신 배경 효과)
export class Rain {
  constructor(scene, { chars = '01', color = '#2cff6a', dir = 1, count = 40, size = 22, alpha = 0.5, depth = -50 } = {}) {
    this.scene = scene;
    this.dir = dir;
    this.chars = [...chars];
    this.items = [];
    for (let i = 0; i < count; i++) {
      const t = scene.add.text(Math.random() * W, Math.random() * H, this.pick(), {
        fontFamily: FONT, fontSize: size * (0.7 + Math.random() * 0.8) + 'px', color,
      }).setAlpha(alpha * (0.4 + Math.random() * 0.6)).setDepth(depth).setOrigin(0.5);
      this.items.push({ t, v: 40 + Math.random() * 140 });
    }
  }
  pick() { return this.chars[Math.floor(Math.random() * this.chars.length)]; }
  update(dt) {
    for (const it of this.items) {
      it.t.y += this.dir * it.v * dt;
      if (this.dir > 0 && it.t.y > H + 30) { it.t.y = -30; it.t.x = Math.random() * W; it.t.setText(this.pick()); }
      if (this.dir < 0 && it.t.y < -30) { it.t.y = H + 30; it.t.x = Math.random() * W; it.t.setText(this.pick()); }
    }
  }
}

// 폭죽/잔해용 일회성 파편 터뜨리기
export function burst(scene, x, y, glyphs = ['✦'], n = 14, color = '#ffe14a', dist = 120, size = 26) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = dist * (0.4 + Math.random() * 0.8);
    const t = T(scene, x, y, glyphs[i % glyphs.length], size, color, { depth: 80 });
    scene.tweens.add({
      targets: t, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d + 30, alpha: 0, angle: Math.random() * 360,
      duration: 500 + Math.random() * 400, ease: 'Cubic.easeOut', onComplete: () => t.destroy(),
    });
  }
}

export const save = {
  get max() { try { return Number(localStorage.getItem('os1000.max') || 0); } catch { return 0; } },
  set max(v) { try { localStorage.setItem('os1000.max', String(v)); } catch { /* 무시 */ } },
};
