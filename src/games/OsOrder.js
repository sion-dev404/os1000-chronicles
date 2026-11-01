import Phaser from 'phaser';
import { W, C, T, css, floatText, burst } from '../ui.js';
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
const CW = 150, CH = 200, R = 16;

export class OsOrder extends BaseGame {
  constructor() { super('OsOrder'); }

  setup() {
    this.goalN = ORDER.length;
    this.next = 0;

    const line = this.add.graphics();
    line.lineStyle(1, 0xffffff, 0.12).lineBetween(W / 2 - 300, 140, W / 2 + 300, 140);
    T(this, W / 2 - 320, 140, '과거', 13, C.muted, { ox: 1, weight: '600' });
    T(this, W / 2 + 320, 140, '미래', 13, C.muted, { ox: 0, weight: '600' });

    const idx = Phaser.Utils.Array.Shuffle([0, 1, 2, 3, 4]);
    idx.forEach((k, pos) => {
      const x = W / 2 + (pos - 2) * (CW + 22);
      const y = 310;
      const c = this.add.container(x, y);
      const bg = this.add.graphics();
      const draw = (state) => {
        bg.clear();
        bg.fillStyle(state === 'done' ? this.accent : C.surface, state === 'done' ? 0.14 : 1);
        bg.fillRoundedRect(-CW / 2, -CH / 2, CW, CH, R);
        bg.lineStyle(state === 'idle' ? 1 : 2, state === 'idle' ? 0xffffff : this.accent, state === 'idle' ? 0.08 : 1);
        bg.strokeRoundedRect(-CW / 2, -CH / 2, CW, CH, R);
      };
      draw('idle');
      const e = T(this, 0, -26, ORDER[k][0], 60);
      const n = T(this, 0, 56, ORDER[k][1], 16, C.text, { weight: '700', w: CW - 20 });
      c.add([bg, e, n]);
      c.setSize(CW, CH).setInteractive({ useHandCursor: true });
      c.on('pointerover', () => { if (!c.done) { draw('hover'); this.tweens.add({ targets: c, y: y - 6, duration: 120 }); } });
      c.on('pointerout', () => { if (!c.done) { draw('idle'); this.tweens.add({ targets: c, y, duration: 120 }); } });
      c.on('pointerdown', () => {
        if (c.done || this.ended || !this.ready) return;
        if (k === this.next) {
          c.done = true;
          draw('done');
          c.y = y;
          const b = this.add.circle(-CW / 2 + 22, -CH / 2 + 22, 12, this.accent);
          const bt = T(this, -CW / 2 + 22, -CH / 2 + 22, String(this.next + 1), 13, css(C.bg), { weight: '800' });
          c.add([b, bt]);
          burst(this, x, y, this.accent, 12, 90);
          this.next++;
          this.addScore();
        } else {
          sfx.bad();
          this.timeLeft = Math.max(0, this.timeLeft - 3);
          this.cameras.main.shake(160, 0.005);
          this.tweens.add({ targets: c, x: x + 8, yoyo: true, repeat: 3, duration: 40, onComplete: () => (c.x = x) });
          floatText(this, x, y - CH / 2 - 16, '-3초', css(C.danger));
        }
      });
    });
  }

  tick() {}
}
