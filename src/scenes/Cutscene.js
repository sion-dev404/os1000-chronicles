import Phaser from 'phaser';
import { W, H, C, T, css, hd, backdrop, panel, button, Rain } from '../ui.js';
import { sfx, bgm } from '../audio.js';
import { CHAPTERS } from '../story.js';

// 이야기 화면: 왼쪽은 챕터 그림 액자, 오른쪽은 그 챕터 이야기 전문 (타자기처럼 나오고, 누르면 바로 전부 표시)
const FRAME = { x: 230, y: 272, s: 380 };
const COL = { x: 470, w: 450 };

export class Cutscene extends Phaser.Scene {
  constructor() { super('Cutscene'); }

  init(d) { this.ch = d.ch; }

  create() {
    const cfg = (this.cfg = CHAPTERS[this.ch]);
    this.accent = cfg.accent;
    hd(this);
    backdrop(this, this.accent);
    this.rain = new Rain(this, { ...cfg.rain, color: css(this.accent), count: 16, alpha: 0.1 });
    bgm(cfg.mood);
    this.cameras.main.fadeIn(450, 11, 13, 20);
    this.events.once('shutdown', () => (this.rain = null));

    this.drawArt();
    this.drawText();

    this.input.on('pointerdown', () => { if (this.typing) this.finishTyping(); });
    sfx.glitch();
  }

  drawArt() {
    const { x, y, s } = FRAME;
    panel(this, x, y, s, s, { r: 24, alpha: 1 });
    const glow = this.add.graphics();
    for (let i = 0; i < 30; i++) {
      glow.fillStyle(this.accent, 0.006);
      glow.fillEllipse(x, y + 40, 60 + i * 10, 50 + i * 8);
    }
    glow.fillStyle(this.accent, 0.05).fillRoundedRect(x - s / 2, y - s / 2, s, s, 24);

    const art = this.add.container(x, y);
    this.cfg.art.forEach((a, i) => {
      const isText = !/\p{Extended_Pictographic}/u.test(a.e);
      const o = isText
        ? T(this, a.x - s / 2, a.y - s / 2, a.e, a.z, css(this.accent), { weight: '800' })
        : T(this, a.x - s / 2, a.y - s / 2, a.e, a.z);
      art.add(o);
      o.setScale(0.6).setAlpha(0);
      this.tweens.add({ targets: o, scale: 1, alpha: 1, duration: 500, delay: 200 + i * 120, ease: 'Back.easeOut', onComplete: () => this.animate(o, a.a, i) });
    });
    // 아주 느린 줌(켄 번스 효과)
    this.tweens.add({ targets: art, scale: 1.04, yoyo: true, repeat: -1, duration: 6000, ease: 'Sine.easeInOut' });
  }

  animate(o, kind, i) {
    if (kind === 'bob') this.tweens.add({ targets: o, y: o.y - 8, yoyo: true, repeat: -1, duration: 1300 + i * 170, ease: 'Sine.easeInOut' });
    if (kind === 'pulse') this.tweens.add({ targets: o, scale: 1.08, yoyo: true, repeat: -1, duration: 800 + i * 90, ease: 'Sine.easeInOut' });
    if (kind === 'spin') this.tweens.add({ targets: o, angle: 360, repeat: -1, duration: 14000 });
    if (kind === 'glitch') {
      const bx = o.x;
      this.time.addEvent({ delay: 140, loop: true, callback: () => {
        const on = Math.random() < 0.25;
        o.x = bx + (on ? Phaser.Math.Between(-5, 5) : 0);
        o.setAlpha(on ? 0.55 : 1);
      } });
    }
  }

  drawText() {
    const last = !this.cfg.game;
    const lab = last ? 'EPILOGUE' : `CHAPTER ${String(this.ch + 1).padStart(2, '0')}`;
    T(this, COL.x, 100, lab, 12, css(this.accent), { ox: 0, weight: '700', ls2: 3 });
    T(this, COL.x, 130, this.cfg.title, 28, C.text, { ox: 0, weight: '800' });
    this.add.rectangle(COL.x, 160, 32, 2, this.accent).setOrigin(0, 0.5);

    // 긴 글은 글자 크기를 줄여 한 화면에 다 들어가게 한다
    let size = 16;
    let body;
    for (;;) {
      body?.destroy();
      body = T(this, COL.x, 180, this.cfg.story, size, '#c9cfdb', { ox: 0, oy: 0, w: COL.w, align: 'left', ls: Math.round(size * 0.6) });
      if (body.height <= 250 || size <= 13) break;
      size--;
    }
    // 타자기 효과 중 줄바꿈 위치가 흔들리지 않도록 미리 줄을 나눠둔다
    this.full = body.getWrappedText(this.cfg.story).join('\n');
    body.setWordWrapWidth(null).setText('');
    this.body = body;

    this.btn = button(this, W - 40 - 100, 476, 200, 48, last ? '엔딩 보기' : '어떻게 할까?', () => this.leave(), { accent: this.accent });
    this.btn.setAlpha(0);

    this.typing = true;
    this.pos = 0;
    this.typer = this.time.addEvent({
      delay: 18, loop: true, startAt: -900,
      callback: () => {
        this.pos += 1;
        this.body.setText(this.full.slice(0, this.pos));
        if (this.pos % 4 === 0) sfx.type();
        if (this.pos >= this.full.length) this.finishTyping();
      },
    });
  }

  finishTyping() {
    this.typer?.remove();
    this.body.setText(this.full);
    this.typing = false;
    this.tweens.add({ targets: this.btn, alpha: 1, duration: 300 });
  }

  leave() {
    if (this.leaving) return;
    this.leaving = true;
    this.typer?.remove();
    this.cameras.main.fadeOut(400, 11, 13, 20);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (this.cfg.game) this.scene.start('Choice', { ch: this.ch });
      else this.scene.start('Ending');
    });
  }

  update(_, dt) { this.rain?.update(dt / 1000); }
}
