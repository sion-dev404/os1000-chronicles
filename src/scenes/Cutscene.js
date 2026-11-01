import Phaser from 'phaser';
import { W, H, C, T, css, backdrop, panel, Rain } from '../ui.js';
import { sfx, bgm } from '../audio.js';
import { CHAPTERS } from '../story.js';

const BAR = 44;

// 이야기 영상: 레터박스 + 챕터 타이틀 카드 + 이모지 연출 + 타자기 자막, 자동 재생(클릭하면 빨리 넘김)
export class Cutscene extends Phaser.Scene {
  constructor() { super('Cutscene'); }

  init(d) { this.ch = d.ch; }

  create() {
    const cfg = (this.cfg = CHAPTERS[this.ch]);
    this.accent = cfg.accent;
    this.li = -1;
    this.typing = false;
    this.leaving = false;
    this.sprites = [];

    backdrop(this, this.accent);
    this.rain = new Rain(this, { ...cfg.rain, color: css(this.accent), count: 22, alpha: 0.14 });
    bgm(cfg.mood);
    this.cameras.main.fadeIn(400, 11, 13, 20);

    // 레터박스
    this.add.rectangle(W / 2, BAR / 2, W, BAR, 0x000000).setDepth(60);
    this.add.rectangle(W / 2, H - BAR / 2, W, BAR, 0x000000).setDepth(60);

    // 자막
    this.subPanel = panel(this, W / 2, 432, W - 140, 84, { fill: 0x000000, alpha: 0.5, stroke: false, r: 14, depth: 61 }).setAlpha(0);
    this.sub = T(this, W / 2, 432, '', 19, C.text, { w: W - 200, depth: 62, ls: 8, weight: '500' });
    this.next = T(this, W - 90, 462, '▾', 14, css(this.accent), { depth: 62 }).setAlpha(0);
    this.tweens.add({ targets: this.next, y: 466, yoyo: true, repeat: -1, duration: 500 });

    // 상단: 진행 점 + 건너뛰기
    this.dots = cfg.lines.map((_, i) => this.add.circle(28 + i * 14, BAR / 2, 3, 0xffffff, 0.25).setDepth(70));
    const skip = T(this, W - 24, BAR / 2, '건너뛰기  ›', 13, C.muted, { ox: 1, depth: 70, weight: '600' }).setInteractive({ useHandCursor: true });
    skip.on('pointerover', () => skip.setColor(C.text));
    skip.on('pointerout', () => skip.setColor(C.muted));
    skip.on('pointerdown', (p, lx, ly, e) => { e?.stopPropagation?.(); this.leave(); });

    this.input.on('pointerdown', () => this.advance());
    this.input.keyboard.on('keydown-SPACE', () => this.advance());
    this.input.keyboard.on('keydown-ENTER', () => this.advance());
    this.events.once('shutdown', () => (this.rain = null));

    this.titleCard();
  }

  titleCard() {
    const lab = this.ch < CHAPTERS.length - 1 ? `CHAPTER ${String(this.ch + 1).padStart(2, '0')}` : 'EPILOGUE';
    const a = T(this, W / 2, 222, lab, 13, css(this.accent), { depth: 90, weight: '700', ls2: 4 }).setAlpha(0);
    const line = this.add.rectangle(W / 2, 248, 0, 2, this.accent).setDepth(90);
    const b = T(this, W / 2, 290, this.cfg.title, 44, C.text, { depth: 90, weight: '800', w: W - 120 }).setAlpha(0);
    b.y += 12;
    this.tweens.add({ targets: a, alpha: 1, duration: 500 });
    this.tweens.add({ targets: line, width: 48, duration: 600, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: b, alpha: 1, y: 290, duration: 700, ease: 'Cubic.easeOut', delay: 150 });
    sfx.boom();
    this.carding = true;
    this.time.delayedCall(2100, () => {
      this.tweens.add({ targets: [a, b, line], alpha: 0, duration: 400, onComplete: () => { a.destroy(); b.destroy(); line.destroy(); this.carding = false; this.showLine(0); } });
    });
  }

  advance() {
    if (this.leaving || this.carding) return;
    if (this.typing) { this.finishTyping(); return; }
    this.showLine(this.li + 1);
  }

  showLine(i) {
    if (i >= this.cfg.lines.length) { this.leave(); return; }
    this.li = i;
    this.autoTimer?.remove();
    const L = this.cfg.lines[i];
    this.dots.forEach((d, k) => d.setFillStyle(k <= i ? this.accent : 0xffffff, k <= i ? 1 : 0.25));

    // 연출 스프라이트
    this.sprites.forEach((s) => this.tweens.add({ targets: s, alpha: 0, y: s.y - 20, duration: 250, onComplete: () => s.destroy() }));
    this.sprites = [];
    const n = L.s.length;
    L.s.forEach((e, k) => {
      const x = W / 2 + (k - (n - 1) / 2) * 200;
      const isText = !/\p{Extended_Pictographic}/u.test(e);
      const s = isText
        ? T(this, x, 220, e, 48, css(this.accent), { depth: 10, weight: '800' })
        : T(this, x, 220, e, 104, '#ffffff', { depth: 10 });
      s.setScale(0.6).setAlpha(0);
      this.tweens.add({
        targets: s, scale: 1, alpha: 1, duration: 500, delay: k * 120, ease: 'Back.easeOut',
        onComplete: () => this.tweens.add({ targets: s, y: s.y - 10, yoyo: true, repeat: -1, duration: 1100 + k * 150, ease: 'Sine.easeInOut' }),
      });
      this.sprites.push(s);
    });

    if (L.shake) this.cameras.main.shake(400, 0.008);
    if (L.flash) this.cameras.main.flash(300, ...L.flash);
    if (L.sfx && sfx[L.sfx]) sfx[L.sfx]();

    // 자막 타자기
    this.subPanel.setAlpha(1);
    this.full = L.t;
    this.sub.setText('');
    this.next.setAlpha(0);
    this.typing = true;
    this.pos = 0;
    this.typer?.remove();
    this.typer = this.time.addEvent({
      delay: 32, loop: true,
      callback: () => {
        this.pos++;
        this.sub.setText(this.full.slice(0, this.pos));
        if (this.pos % 3 === 0) sfx.type();
        if (this.pos >= this.full.length) this.finishTyping();
      },
    });
  }

  finishTyping() {
    this.typer?.remove();
    this.sub.setText(this.full);
    this.typing = false;
    this.next.setAlpha(1);
    this.autoTimer = this.time.delayedCall(2600 + this.full.length * 25, () => this.advance());
  }

  leave() {
    if (this.leaving) return;
    this.leaving = true;
    this.typer?.remove();
    this.autoTimer?.remove();
    this.cameras.main.fadeOut(450, 11, 13, 20);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (this.cfg.game) this.scene.start(this.cfg.game, { ch: this.ch });
      else this.scene.start('Ending');
    });
  }

  update(_, dt) { this.rain?.update(dt / 1000); }
}
