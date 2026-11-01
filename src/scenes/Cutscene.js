import Phaser from 'phaser';
import { W, H, T, gradientBg, Rain } from '../ui.js';
import { sfx, bgm } from '../audio.js';
import { CHAPTERS } from '../story.js';

// 이야기 영상: 레터박스 + 챕터 타이틀 카드 + 이모지 연출 + 타자기 자막, 자동 재생(클릭하면 빨리 넘김)
export class Cutscene extends Phaser.Scene {
  constructor() { super('Cutscene'); }

  init(d) { this.ch = d.ch; }

  create() {
    const cfg = (this.cfg = CHAPTERS[this.ch]);
    this.li = -1;
    this.typing = false;
    this.leaving = false;
    this.sprites = [];

    gradientBg(this, cfg.bg[0], cfg.bg[1]);
    this.rain = new Rain(this, { ...cfg.rain, count: 50, alpha: 0.45 });
    bgm(cfg.mood);

    // 레터박스
    this.barTop = this.add.rectangle(W / 2, -40, W, 80, 0x000000).setDepth(60);
    this.barBot = this.add.rectangle(W / 2, H + 40, W, 80, 0x000000).setDepth(60);
    this.tweens.add({ targets: this.barTop, y: 40, duration: 600 });
    this.tweens.add({ targets: this.barBot, y: H - 40, duration: 600 });

    // 자막 박스
    this.subBox = this.add.rectangle(W / 2, 438, W - 100, 108, 0x000000, 0.62).setDepth(61).setAlpha(0);
    this.sub = T(this, W / 2, 438, '', 24, '#ffffff', { w: W - 150, depth: 62, ls: 6 });
    this.next = T(this, W - 90, 480, '▶', 22, '#ffe14a', { depth: 62 }).setAlpha(0);
    this.tweens.add({ targets: this.next, scale: 1.4, yoyo: true, repeat: -1, duration: 450 });

    // 건너뛰기
    const skip = T(this, W - 80, 30, '건너뛰기 ⏭', 20, '#ffffff', { depth: 70, stroke: '#000', st: 4 }).setInteractive({ useHandCursor: true });
    skip.on('pointerdown', (p, lx, ly, e) => { e?.stopPropagation?.(); this.leave(); });

    // 진행 점
    this.dots = cfg.lines.map((_, i) => this.add.circle(W / 2 - (cfg.lines.length - 1) * 10 + i * 20, 66, 5, 0x555555).setDepth(70));

    this.input.on('pointerdown', () => this.advance());
    this.input.keyboard.on('keydown-SPACE', () => this.advance());
    this.input.keyboard.on('keydown-ENTER', () => this.advance());
    this.events.once('shutdown', () => this.rain = null);

    this.titleCard();
  }

  titleCard() {
    const lab = this.ch < 8 ? `제 ${this.ch + 1} 장` : '에필로그';
    const a = T(this, W / 2, 210, lab, 34, '#9aa7ff', { depth: 90, bold: true }).setAlpha(0);
    const b = T(this, W / 2, 270, this.cfg.title, 56, '#ffffff', { depth: 90, bold: true, stroke: '#000', st: 8, w: W - 80 }).setAlpha(0).setScale(1.6);
    this.tweens.add({ targets: a, alpha: 1, duration: 500 });
    this.tweens.add({ targets: b, alpha: 1, scale: 1, duration: 600, ease: 'Back.easeOut' });
    sfx.boom();
    this.carding = true;
    this.time.delayedCall(2000, () => {
      this.tweens.add({ targets: [a, b], alpha: 0, duration: 400, onComplete: () => { a.destroy(); b.destroy(); this.carding = false; this.showLine(0); } });
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
    this.dots.forEach((d, k) => d.setFillStyle(k <= i ? 0xffe14a : 0x555555));

    // 연출 스프라이트
    this.sprites.forEach((s) => this.tweens.add({ targets: s, alpha: 0, y: s.y - 30, duration: 250, onComplete: () => s.destroy() }));
    this.sprites = [];
    const n = L.s.length;
    L.s.forEach((e, k) => {
      const x = W / 2 + (k - (n - 1) / 2) * 220;
      const isText = [...e].length > 2 && !/\p{Extended_Pictographic}/u.test(e);
      const s = T(this, x, 230, e, isText ? 54 : 120, isText ? '#ffe14a' : '#ffffff', { depth: 10, bold: true, stroke: isText ? '#000' : undefined, st: isText ? 6 : 0 }).setScale(0).setAlpha(0);
      this.tweens.add({
        targets: s, scale: 1, alpha: 1, duration: 450, delay: k * 140, ease: 'Back.easeOut',
        onComplete: () => this.tweens.add({ targets: s, y: s.y - 16, yoyo: true, repeat: -1, duration: 900 + k * 120, ease: 'Sine.easeInOut' }),
      });
      this.sprites.push(s);
    });

    if (L.shake) this.cameras.main.shake(500, 0.012);
    if (L.flash) this.cameras.main.flash(350, ...L.flash);
    if (L.sfx && sfx[L.sfx]) sfx[L.sfx]();

    // 자막 타자기
    this.subBox.setAlpha(1);
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
    this.cameras.main.fadeOut(450, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (this.cfg.game) this.scene.start(this.cfg.game, { ch: this.ch });
      else this.scene.start('Ending');
    });
  }

  update(_, dt) { this.rain?.update(dt / 1000); }
}
