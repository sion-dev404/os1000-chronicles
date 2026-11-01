import Phaser from 'phaser';
import { W, H, C, T, css, burst } from '../ui.js';
import { sfx } from '../audio.js';
import { BaseGame } from './BaseGame.js';

// 3장: 99원 특가 팝업 닫기. 8개 이상 쌓이면 패배
const ADS = ['99원 특가', '오늘만 무료배송', '딥시크가 생각 중...', '당첨되셨습니다', '마감 1초 전', '신규가입 99원', '쿠폰이 도착했어요', 'Thinking...'];
const MAX_OPEN = 8;

export class Popup extends BaseGame {
  constructor() { super('Popup'); }

  setup() {
    this.goalN = 15;
    this.pops = [];
    this.spawnT = 0;
    this.z = 10;
    this.cnt = T(this, W / 2, H - 24, '', 13, C.muted, { depth: 41, weight: '600' });
  }

  spawn() {
    const w = Phaser.Math.Between(220, 260);
    const h = 130;
    const x = Phaser.Math.Between(w / 2 + 16, W - w / 2 - 16);
    const y = Phaser.Math.Between(110 + h / 2, H - h / 2 - 44);
    const c = this.add.container(x, y).setDepth(this.z++);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.35).fillRoundedRect(-w / 2 + 3, -h / 2 + 6, w, h, 12);
    g.fillStyle(0xf7f7fa, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    g.fillStyle(0xe9e9ef, 1).fillRoundedRect(-w / 2, -h / 2, w, 30, { tl: 12, tr: 12, bl: 0, br: 0 });
    g.fillStyle(this.accent, 1).fillCircle(-w / 2 + 16, -h / 2 + 15, 4);
    const brand = T(this, -w / 2 + 28, -h / 2 + 15, '특가 알림', 11, '#6b7080', { ox: 0, weight: '600' });
    const txt = T(this, 0, 14, Phaser.Utils.Array.GetRandom(ADS), 19, '#1b1f2a', { weight: '700', w: w - 32 });
    const xb = this.add.circle(w / 2 - 16, -h / 2 + 15, 10, 0xd6d7de).setInteractive({ useHandCursor: true });
    const xt = T(this, w / 2 - 16, -h / 2 + 15, '✕', 11, '#3a3f4d', { weight: '700' });
    xb.on('pointerover', () => xb.setFillStyle(C.danger));
    xb.on('pointerout', () => xb.setFillStyle(0xd6d7de));
    c.add([g, brand, txt, xb, xt]);
    c.setScale(0.85).setAlpha(0);
    this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 160, ease: 'Cubic.easeOut' });
    xb.on('pointerdown', () => {
      if (this.ended || !this.ready) return;
      burst(this, c.x, c.y, this.accent, 10, 70);
      sfx.pop();
      c.destroy();
      this.pops = this.pops.filter((p) => p !== c);
      this.addScore();
    });
    this.pops.push(c);
  }

  tick(dt) {
    this.spawnT -= dt;
    if (this.spawnT <= 0) { this.spawn(); this.spawnT = Math.max(0.55, 1.15 - this.score * 0.04); }
    const n = this.pops.length;
    this.cnt.setText(`열린 팝업 ${n} / ${MAX_OPEN}`).setColor(n >= MAX_OPEN - 2 ? css(C.danger) : C.muted);
    if (n >= MAX_OPEN) this.lose('팝업에 시스템이 마비됐습니다.');
  }
}
