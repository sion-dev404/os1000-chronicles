import Phaser from 'phaser';
import { W, H, C, T, css, backdrop, panel, button, chip, save } from '../ui.js';
import { sfx, bgm } from '../audio.js';
import { CHAPTERS } from '../story.js';

// 모든 미니게임 공통: 배경, HUD(진행바/챕터/목숨/타이머), 미션 카드, 승패 카드
export class BaseGame extends Phaser.Scene {
  init(d) { this.ch = d.ch; }

  create() {
    const cfg = (this.cfg = CHAPTERS[this.ch]);
    this.accent = cfg.accent;
    this.ended = false;
    this.ready = false;
    this.lives = 3;
    this.score = 0;
    this.goalN = 1;
    this.timeLeft = cfg.time || 0;

    backdrop(this, this.accent);
    this.buildHud();
    bgm(cfg.mood);
    this.setup();
    this.refreshHud();
    this.showBrief();
  }

  buildHud() {
    const d = 40;
    this.add.rectangle(W / 2, 2, W, 4, 0xffffff, 0.06).setDepth(d);
    this.bar = this.add.rectangle(0, 2, 0, 4, this.accent).setOrigin(0, 0.5).setDepth(d + 1);

    T(this, 24, 28, `CHAPTER ${String(this.ch + 1).padStart(2, '0')}`, 11, css(this.accent), { ox: 0, weight: '700', depth: d, ls2: 2 });
    T(this, 24, 48, this.cfg.title, 17, C.text, { ox: 0, weight: '700', depth: d });
    this.hudGoal = T(this, 24, 70, this.cfg.goal, 13, C.muted, { ox: 0, depth: d });

    this.hudTime = T(this, W - 24, 40, '', 26, C.text, { ox: 1, weight: '700', depth: d });
    this.hudTimeLabel = T(this, W - 24, 66, this.cfg.time ? '남은 시간' : '', 11, C.dim, { ox: 1, depth: d });
    this.livesG = this.add.graphics().setDepth(d);
  }

  refreshHud() {
    if (this.cfg.time) this.hudTime.setText(Math.max(0, this.timeLeft).toFixed(1));
    const g = this.livesG;
    g.clear();
    const right = this.cfg.time ? W - 110 : W - 24;
    for (let i = 0; i < 3; i++) {
      const x = right - i * 18;
      if (2 - i < this.lives) { g.fillStyle(C.danger, 1); g.fillCircle(x, 40, 5); }
      else { g.lineStyle(1.5, 0xffffff, 0.25); g.strokeCircle(x, 40, 5); }
    }
    if (this.cfg.time && this.timeLeft < 5) this.hudTime.setColor(css(C.danger));
    this.bar.width = W * Phaser.Math.Clamp(this.score / this.goalN, 0, 1);
  }

  showBrief() {
    const items = [];
    const dim = this.add.rectangle(W / 2, H / 2, W, H, C.bg, 0.7).setDepth(90).setInteractive();
    items.push(dim, panel(this, W / 2, H / 2, 560, 280, { depth: 91, r: 20 }));
    items.push(chip(this, W / 2, H / 2 - 92, 'MISSION', this.accent, { depth: 92 }));
    items.push(T(this, W / 2, H / 2 - 22, this.cfg.brief, 22, C.text, { weight: '600', depth: 92, ls: 10 }));
    items.push(T(this, W / 2, H / 2 + 38, `목표  ${this.cfg.goal}`, 14, C.muted, { depth: 92 }));
    const go = () => {
      if (this.ready) return;
      sfx.click();
      items.forEach((o) => o.destroy());
      this.ready = true;
      this.onStart?.();
    };
    items.push(button(this, W / 2, H / 2 + 92, 200, 48, '시작하기', go, { accent: this.accent, depth: 93 }));
    dim.once('pointerdown', go);
    this.input.keyboard.once('keydown-SPACE', go);
    this.input.keyboard.once('keydown-ENTER', go);
  }

  addScore(n = 1) {
    this.score += n;
    sfx.good();
    this.refreshHud();
    if (this.score >= this.goalN && !this.ended) this.win();
  }

  hurt() {
    if (this.ended) return;
    this.lives--;
    sfx.bad();
    this.cameras.main.shake(200, 0.006);
    this.refreshHud();
    if (this.lives <= 0) this.lose('목숨을 모두 잃었습니다.');
  }

  update(t, dt) {
    if (!this.ready || this.ended) return;
    const s = dt / 1000;
    if (this.cfg.time) {
      this.timeLeft -= s;
      if (this.timeLeft <= 0) { this.timeLeft = 0; this.refreshHud(); this.onTimeUp(); if (this.ended) return; }
      this.refreshHud();
    }
    this.tick(s, t);
  }

  onTimeUp() { this.lose('시간이 다 됐습니다.'); }

  resultCard(title, color, msg) {
    this.add.rectangle(W / 2, H / 2, W, H, C.bg, 0.75).setDepth(90);
    const g = panel(this, W / 2, H / 2, 480, 220, { depth: 91, r: 20 });
    const a = T(this, W / 2, H / 2 - 56, title, 34, css(color), { weight: '800', depth: 92 });
    const b = T(this, W / 2, H / 2 - 14, msg, 15, C.muted, { depth: 92 });
    [g, a, b].forEach((o) => { o.setAlpha(0); this.tweens.add({ targets: o, alpha: 1, duration: 250 }); });
  }

  win() {
    if (this.ended) return;
    this.ended = true;
    this.cleanup?.();
    save.max = Math.max(save.max, this.ch + 1);
    sfx.win();
    const last = this.ch + 1 >= CHAPTERS.length - 1;
    this.resultCard('챕터 클리어', this.accent, last ? '마지막 이야기로 이어집니다' : `다음은 제 ${this.ch + 2} 장입니다`);
    let gone = false;
    const go = () => {
      if (gone) return;
      gone = true;
      this.cameras.main.fadeOut(400, 11, 13, 20);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Cutscene', { ch: this.ch + 1 }));
    };
    button(this, W / 2, H / 2 + 46, 200, 48, '계속하기', go, { accent: this.accent, depth: 95 });
    this.time.delayedCall(2600, go);
  }

  lose(msg) {
    if (this.ended) return;
    this.ended = true;
    this.cleanup?.();
    sfx.lose();
    this.resultCard('게임 오버', C.danger, msg);
    button(this, W / 2 - 104, H / 2 + 46, 190, 48, '다시 도전', () => this.scene.restart({ ch: this.ch }), { accent: this.accent, depth: 95 });
    button(this, W / 2 + 104, H / 2 + 46, 190, 48, '타이틀로', () => this.scene.start('Title'), { variant: 'ghost', depth: 95 });
    this.input.keyboard.once('keydown-R', () => this.scene.restart({ ch: this.ch }));
  }
}
