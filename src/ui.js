import Phaser from 'phaser';
import { sfx } from './audio.js';

export const W = 960;
export const H = 540;
export const FONT = "Pretendard, 'Malgun Gothic', 'Apple SD Gothic Neo', 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif";

// 디자인 토큰: 어두운 무채색 바탕 + 챕터별 포인트 색 하나
export const C = {
  bg: 0x0b0d14,
  surface: 0x151924,
  line: 0xffffff,
  text: '#f2f4f8',
  muted: '#8a93a6',
  dim: '#5b6375',
  danger: 0xff5d73,
  success: 0x4ade80,
};

export const css = (n) => '#' + n.toString(16).padStart(6, '0');

export function T(scene, x, y, str, size = 24, color = C.text, o = {}) {
  const t = scene.add.text(x, y, str, {
    fontFamily: FONT,
    fontSize: size + 'px',
    color,
    align: o.align || 'center',
    fontStyle: o.weight || (o.bold ? 'bold' : 'normal'),
    lineSpacing: o.ls ?? Math.round(size * 0.35),
    wordWrap: o.w ? { width: o.w, useAdvancedWrap: true } : undefined,
  });
  t.setOrigin(o.ox ?? 0.5, o.oy ?? 0.5);
  if (o.ls2) t.setLetterSpacing?.(o.ls2);
  if (o.depth !== undefined) t.setDepth(o.depth);
  return t;
}

// 바탕 + 위쪽에서 은은하게 번지는 포인트 색 빛
export function backdrop(scene, accent, depth = -100) {
  scene.add.rectangle(W / 2, H / 2, W, H, C.bg).setDepth(depth);
  const g = scene.add.graphics().setDepth(depth + 1);
  for (let i = 0; i < 60; i++) {
    g.fillStyle(accent, 0.0025);
    g.fillEllipse(W / 2, -40, 300 + i * 20, 160 + i * 11);
  }
  return g;
}

export function panel(scene, x, y, w, h, o = {}) {
  const g = scene.add.graphics();
  const r = o.r ?? 16;
  g.fillStyle(o.fill ?? C.surface, o.alpha ?? 0.96);
  g.fillRoundedRect(x - w / 2, y - h / 2, w, h, r);
  if (o.stroke !== false) {
    g.lineStyle(o.sw ?? 1, o.stroke ?? C.line, o.strokeAlpha ?? 0.08);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, r);
  }
  if (o.depth !== undefined) g.setDepth(o.depth);
  return g;
}

// 둥근 버튼: primary(포인트 색 채움) / ghost(테두리만)
export function button(scene, x, y, w, h, label, cb, o = {}) {
  const accent = o.accent ?? 0x6c8cff;
  const ghost = o.variant === 'ghost';
  const depth = o.depth ?? 50;
  const c = scene.add.container(x, y).setDepth(depth);
  const g = scene.add.graphics();
  const draw = (hover) => {
    g.clear();
    if (ghost) {
      g.fillStyle(0xffffff, hover ? 0.08 : 0.03);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
      g.lineStyle(1, 0xffffff, hover ? 0.3 : 0.16);
      g.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    } else {
      g.fillStyle(accent, 1);
      g.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
      if (hover) { g.fillStyle(0xffffff, 0.14); g.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2); }
    }
  };
  draw(false);
  const t = T(scene, 0, 0, label, o.size ?? 18, ghost ? C.text : (o.textColor ?? '#0b0d14'), { weight: '700' });
  c.add([g, t]);
  c.setSize(w, h).setInteractive({ useHandCursor: true });
  c.on('pointerover', () => draw(true));
  c.on('pointerout', () => draw(false));
  c.on('pointerdown', (p, lx, ly, e) => { e?.stopPropagation?.(); sfx.click(); cb(); });
  return c;
}

export function chip(scene, x, y, label, accent, o = {}) {
  const t = T(scene, 0, 0, label, o.size ?? 13, css(accent), { weight: '700' });
  const w = t.width + 24;
  const h = (o.size ?? 13) + 14;
  const g = scene.add.graphics();
  g.fillStyle(accent, 0.14);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
  const c = scene.add.container(x, y, [g, t]);
  if (o.depth !== undefined) c.setDepth(o.depth);
  return c;
}

// 위/아래로 천천히 흐르는 문자 (배경 효과, 아주 옅게)
export class Rain {
  constructor(scene, { chars = '01', color = '#ffffff', dir = 1, count = 20, size = 18, alpha = 0.12, depth = -50 } = {}) {
    this.dir = dir;
    this.chars = [...chars];
    this.items = [];
    for (let i = 0; i < count; i++) {
      const t = scene.add.text(Math.random() * W, Math.random() * H, this.pick(), {
        fontFamily: FONT, fontSize: Math.round(size * (0.7 + Math.random() * 0.6)) + 'px', color,
      }).setAlpha(alpha * (0.4 + Math.random() * 0.6)).setDepth(depth).setOrigin(0.5);
      this.items.push({ t, v: 18 + Math.random() * 40 });
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

// 효과용 파편: 작은 원 조각이 퍼졌다 사라진다
export function burst(scene, x, y, color = 0xffffff, n = 12, dist = 90, size = 4) {
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
    const d = dist * (0.5 + Math.random() * 0.6);
    const c = scene.add.circle(x, y, size * (0.6 + Math.random() * 0.8), color).setDepth(80);
    scene.tweens.add({
      targets: c, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, scale: 0.3,
      duration: 450 + Math.random() * 300, ease: 'Cubic.easeOut', onComplete: () => c.destroy(),
    });
  }
}

// 떠올랐다 사라지는 짧은 문구 (+1, -3초 등)
export function floatText(scene, x, y, str, color = C.text) {
  const t = T(scene, x, y, str, 18, color, { weight: '700', depth: 85 });
  scene.tweens.add({ targets: t, y: y - 36, alpha: 0, duration: 650, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
}

export const save = {
  get max() { try { return Number(localStorage.getItem('os1000.max') || 0); } catch { return 0; } },
  set max(v) { try { localStorage.setItem('os1000.max', String(v)); } catch { /* 무시 */ } },
};
