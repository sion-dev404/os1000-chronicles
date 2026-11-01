import Phaser from 'phaser';
import { W, H, T, gradientBg, button, save } from '../ui.js';
import { sfx, bgm } from '../audio.js';
import { CHAPTERS } from '../story.js';

// 모든 미니게임 공통: 배경, HUD(목표/타이머/목숨/진행바), 미션 안내, 승패 처리
export class BaseGame extends Phaser.Scene {
  init(d) { this.ch = d.ch; }

  create() {
    const cfg = (this.cfg = CHAPTERS[this.ch]);
    this.ended = false;
    this.ready = false;
    this.lives = 3;
    this.score = 0;
    this.goalN = 1;
    this.timeLeft = cfg.time || 0;

    gradientBg(this, cfg.bg[0], cfg.bg[1]);
    const g = this.add.graphics().setDepth(-90);
    g.lineStyle(1, 0xffffff, 0.05);
    for (let x = 0; x < W; x += 40) g.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 40) g.lineBetween(0, y, W, y);

    // HUD
    this.add.rectangle(W / 2, 22, W, 44, 0x000000, 0.55).setDepth(40);
    this.hudTitle = T(this, 14, 22, `제 ${this.ch + 1} 장 · ${cfg.title}`, 18, '#ffffff', { ox: 0, depth: 41 });
    this.hudTime = T(this, W - 14, 22, '', 22, '#ffe14a', { ox: 1, depth: 41, bold: true });
    this.hudLives = T(this, W - 120, 22, '', 20, '#ff6a6a', { ox: 1, depth: 41 });
    this.barBg = this.add.rectangle(W / 2, 52, W - 28, 8, 0xffffff, 0.15).setDepth(40);
    this.bar = this.add.rectangle(14, 52, 0, 8, 0x38ff7a).setOrigin(0, 0.5).setDepth(41);
    this.hudGoal = T(this, W / 2, 80, cfg.goal, 18, '#b9c2ff', { depth: 41 });

    bgm(cfg.mood);
    this.setup();
    this.refreshHud();
    this.showBrief();
  }

  showBrief() {
    const cover = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.78).setDepth(90);
    const a = T(this, W / 2, 200, 'MISSION', 26, '#9aa7ff', { depth: 91, bold: true });
    const b = T(this, W / 2, 270, this.cfg.brief, 32, '#ffffff', { depth: 91, bold: true, w: W - 120, ls: 8 });
    const c = T(this, W / 2, 360, '화면을 눌러 시작', 22, '#ffe14a', { depth: 91 });
    this.tweens.add({ targets: c, alpha: 0.2, yoyo: true, repeat: -1, duration: 500 });
    cover.setInteractive();
    const go = () => {
      if (this.ready) return;
      sfx.click();
      [cover, a, b, c].forEach((o) => o.destroy());
      this.ready = true;
      this.onStart?.();
    };
    cover.once('pointerdown', go);
    this.input.keyboard.once('keydown-SPACE', go);
    this.input.keyboard.once('keydown-ENTER', go);
  }

  refreshHud() {
    if (this.cfg.time) this.hudTime.setText(`⏱ ${Math.max(0, this.timeLeft).toFixed(1)}`);
    this.hudLives.setText('❤'.repeat(Math.max(0, this.lives)) + '🖤'.repeat(Math.max(0, 3 - this.lives)));
    this.bar.width = (W - 28) * Phaser.Math.Clamp(this.score / this.goalN, 0, 1);
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
    this.cameras.main.shake(250, 0.01);
    this.cameras.main.flash(200, 255, 0, 0);
    this.refreshHud();
    if (this.lives <= 0) this.lose('목숨을 모두 잃었다...');
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

  onTimeUp() { this.lose('시간 초과!'); }

  win() {
    if (this.ended) return;
    this.ended = true;
    this.cleanup?.();
    save.max = Math.max(save.max, this.ch + 1);
    sfx.win();
    this.cameras.main.flash(300, 255, 255, 255);
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setDepth(90);
    const t = T(this, W / 2, H / 2, '챕터 클리어! 🎉', 64, '#ffe14a', { depth: 91, bold: true, stroke: '#000', st: 8 }).setScale(0);
    this.tweens.add({ targets: t, scale: 1, duration: 500, ease: 'Back.easeOut' });
    this.time.delayedCall(1700, () => {
      this.cameras.main.fadeOut(450, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Cutscene', { ch: this.ch + 1 }));
    });
  }

  lose(msg) {
    if (this.ended) return;
    this.ended = true;
    this.cleanup?.();
    sfx.lose();
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72).setDepth(90);
    T(this, W / 2, 190, '게임 오버', 64, '#ff5a5a', { depth: 91, bold: true, stroke: '#000', st: 8 });
    T(this, W / 2, 255, msg, 26, '#ffffff', { depth: 91 });
    button(this, W / 2 - 150, 340, 250, 60, '↻ 다시 도전', () => this.scene.restart({ ch: this.ch }), 0x2a6cff, 24, 95);
    button(this, W / 2 + 150, 340, 250, 60, '타이틀로', () => this.scene.start('Title'), 0x7a3aff, 24, 95);
    this.input.keyboard.once('keydown-R', () => this.scene.restart({ ch: this.ch }));
  }
}
