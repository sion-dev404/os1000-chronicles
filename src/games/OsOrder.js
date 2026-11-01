import Phaser from 'phaser';
import { W, H, T, burst } from '../ui.js';
import { sfx } from '../audio.js';
import { BaseGame } from './BaseGame.js';

// 4장: 운영체제 진화 순서대로 카드 클릭
const ORDER = [
  ['⬛', '프리도스'],
  ['🪟', '윈도우 비스타'],
  ['🚀', '윈도우 12'],
  ['🍎', '맥츠맥'],
  ['💎', '윈도우 맥스프로'],
];

export class OsOrder extends BaseGame {
  constructor() { super('OsOrder'); }

  setup() {
    this.goalN = ORDER.length;
    this.next = 0;
    const idx = Phaser.Utils.Array.Shuffle([0, 1, 2, 3, 4]);
    T(this, W / 2, 125, '과거 ──────────────▶ 미래', 22, '#9aa7ff');
    idx.forEach((k, pos) => {
      const x = 105 + pos * 187;
      const y = 300;
      const c = this.add.container(x, y);
      const bg = this.add.rectangle(0, 0, 165, 230, 0x13203a).setStrokeStyle(4, 0x6aa8ff);
      const e = T(this, 0, -35, ORDER[k][0], 70);
      const n = T(this, 0, 55, ORDER[k][1], 22, '#ffffff', { bold: true, w: 150 });
      c.add([bg, e, n]);
      c.setSize(165, 230).setInteractive({ useHandCursor: true });
      c.on('pointerover', () => !c.done && this.tweens.add({ targets: c, y: y - 8, duration: 100 }));
      c.on('pointerout', () => !c.done && this.tweens.add({ targets: c, y, duration: 100 }));
      c.on('pointerdown', () => {
        if (c.done || this.ended || !this.ready) return;
        if (k === this.next) {
          c.done = true;
          bg.setFillStyle(0x145a2a).setStrokeStyle(4, 0x38ff7a);
          const badge = T(this, -60, -95, String(this.next + 1), 28, '#000', { bold: true });
          const b = this.add.circle(-60, -95, 18, 0xffe14a);
          c.add([b, badge]);
          burst(this, x, y, ['✦'], 10, '#38ff7a', 90);
          this.next++;
          this.addScore();
        } else {
          sfx.bad();
          this.timeLeft = Math.max(0, this.timeLeft - 3);
          this.cameras.main.shake(180, 0.008);
          this.tweens.add({ targets: c, x: x + 10, yoyo: true, repeat: 3, duration: 40, onComplete: () => (c.x = x) });
          const pen = T(this, x, y - 140, '-3초', 28, '#ff6a6a', { bold: true, depth: 80 });
          this.tweens.add({ targets: pen, y: pen.y - 40, alpha: 0, duration: 700, onComplete: () => pen.destroy() });
        }
      });
    });
  }

  tick() {}
}
