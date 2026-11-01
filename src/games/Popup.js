import Phaser from 'phaser';
import { W, H, T, burst } from '../ui.js';
import { sfx } from '../audio.js';
import { BaseGame } from './BaseGame.js';

// 3장: 99원 특가 팝업 닫기. 8개 이상 쌓이면 패배
const ADS = ['99원 특가!!', '🛒 오늘만 무료배송', '딥시크가 생각 중...', '당첨! 클릭하세요', '⚡ 1초 남았습니다', '신규가입 99원', '쿠폰 폭탄 🎁', 'Thinking...'];
const MAX_OPEN = 8;

export class Popup extends BaseGame {
  constructor() { super('Popup'); }

  setup() {
    this.goalN = 15;
    this.pops = [];
    this.spawnT = 0;
    this.z = 10;
    this.cnt = T(this, 14, H - 18, '', 18, '#ff9a9a', { ox: 0, depth: 41 });
  }

  spawn() {
    const w = Phaser.Math.Between(220, 280);
    const h = Phaser.Math.Between(120, 160);
    const x = Phaser.Math.Between(w / 2 + 10, W - w / 2 - 10);
    const y = Phaser.Math.Between(130 + h / 2, H - h / 2 - 20);
    const c = this.add.container(x, y).setDepth(this.z++);
    const body = this.add.rectangle(0, 0, w, h, 0xfff3c4).setStrokeStyle(4, 0xff7a00);
    const head = this.add.rectangle(0, -h / 2 + 14, w, 28, 0xff7a00);
    const txt = T(this, 0, 8, Phaser.Utils.Array.GetRandom(ADS), 22, '#7a1d00', { bold: true, w: w - 20 });
    const xb = T(this, w / 2 - 18, -h / 2 + 14, '✕', 24, '#ffffff', { bold: true }).setInteractive({ useHandCursor: true });
    c.add([body, head, txt, xb]);
    c.setScale(0);
    this.tweens.add({ targets: c, scale: 1, duration: 180, ease: 'Back.easeOut' });
    xb.on('pointerdown', () => {
      if (this.ended || !this.ready) return;
      burst(this, c.x, c.y, ['✦'], 8, '#ffb02e', 70, 22);
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
    this.cnt.setText(`열린 팝업 ${this.pops.length} / ${MAX_OPEN}`);
    if (this.pops.length >= MAX_OPEN) this.lose('팝업에 시스템이 마비됐다...');
  }
}
