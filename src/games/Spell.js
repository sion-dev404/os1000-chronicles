import Phaser from 'phaser';
import { W, C, T, css, burst } from '../ui.js';
import { sfx } from '../audio.js';
import { BaseGame } from './BaseGame.js';

// 1장: 흩어진 글자 타일을 순서대로 눌러 문장 완성 (키보드 없이 터치/클릭만)
const DECOYS = [...'균쟈앶꿻뷁ㅆㅂ괡'];
const SLOT = 46, TILE = 58, GAP = 10;

export class Spell extends BaseGame {
  constructor() { super('Spell'); }

  setup() {
    this.phrases = this.cfg.phrases;
    this.goalN = this.phrases.length;
    this.idx = 0;
    this.step = T(this, W / 2, 150, '', 13, C.muted, { weight: '600' });
    this.objs = [];
  }

  onStart() { this.showPhrase(); }

  showPhrase() {
    this.objs.forEach((o) => o.destroy());
    this.objs = [];
    const phrase = this.phrases[this.idx];
    this.step.setText(`${this.idx + 1} / ${this.goalN}`);
    this.chars = [...phrase].filter((ch) => ch !== ' ');
    this.pos = 0;

    // 위: 완성될 칸 (띄어쓰기는 간격으로만 표시)
    const cells = [...phrase];
    const totalW = cells.reduce((s, ch) => s + (ch === ' ' ? 18 : SLOT + 6), -6);
    let x = W / 2 - totalW / 2;
    this.slots = [];
    for (const ch of cells) {
      if (ch === ' ') { x += 18; continue; }
      const g = this.add.graphics();
      g.lineStyle(2, 0xffffff, 0.14).lineBetween(x + 4, 246, x + SLOT - 4, 246);
      const t = T(this, x + SLOT / 2, 216, ch, 34, C.dim, { weight: '800' }).setAlpha(0.18);
      this.slots.push(t);
      this.objs.push(g, t);
      x += SLOT + 6;
    }

    // 아래: 섞인 글자 타일 + 함정 글자 2개
    const pool = Phaser.Utils.Array.Shuffle([...this.chars, ...Phaser.Utils.Array.Shuffle([...DECOYS]).slice(0, 2)]);
    const rowW = pool.length * (TILE + GAP) - GAP;
    pool.forEach((ch, i) => {
      const tx = W / 2 - rowW / 2 + TILE / 2 + i * (TILE + GAP);
      const ty = 360 + (i % 2 ? 14 : -14);
      const c = this.add.container(tx, ty);
      const g = this.add.graphics();
      const draw = (hover) => {
        g.clear();
        g.fillStyle(C.surface, 1).fillRoundedRect(-TILE / 2, -TILE / 2, TILE, TILE, 14);
        g.lineStyle(1, hover ? this.accent : 0xffffff, hover ? 0.9 : 0.1).strokeRoundedRect(-TILE / 2, -TILE / 2, TILE, TILE, 14);
      };
      draw(false);
      c.add([g, T(this, 0, 0, ch, 26, C.text, { weight: '700' })]);
      c.setSize(TILE, TILE).setInteractive({ useHandCursor: true });
      c.on('pointerover', () => draw(true));
      c.on('pointerout', () => draw(false));
      c.on('pointerdown', () => this.pick(c, ch));
      c.setScale(0.6).setAlpha(0);
      this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 260, delay: i * 30, ease: 'Back.easeOut' });
      this.objs.push(c);
    });
  }

  pick(c, ch) {
    if (!this.ready || this.ended || c.used) return;
    if (ch !== this.chars[this.pos]) {
      this.tweens.add({ targets: c, x: c.x + 6, yoyo: true, repeat: 3, duration: 40 });
      this.hurt();
      return;
    }
    c.used = true;
    sfx.type();
    const slot = this.slots[this.pos];
    slot.setColor(css(this.accent)).setAlpha(1).setScale(1.3);
    this.tweens.add({ targets: slot, scale: 1, duration: 180 });
    this.tweens.add({ targets: c, alpha: 0, scale: 0.6, duration: 160 });
    c.disableInteractive();
    this.pos++;
    if (this.pos < this.chars.length) return;

    burst(this, W / 2, 216, this.accent, 18, 180, 4);
    this.idx++;
    this.addScore();
    if (!this.ended) this.time.delayedCall(500, () => this.showPhrase());
  }

  tick() {}
}
