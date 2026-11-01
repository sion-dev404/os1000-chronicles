import Phaser from 'phaser';
import { W, H, T, burst } from '../ui.js';
import { sfx } from '../audio.js';
import { BaseGame } from './BaseGame.js';

// 6장: 폭파 게이지 타이밍 맞추기. 3회 성공 / 3회 실패(목숨 소진) 패배
export class Timing extends BaseGame {
  constructor() { super('Timing'); }

  setup() {
    this.goalN = 3;
    this.round = 0;
    this.pos = 0;
    this.dir = 1;
    this.gfx = this.add.graphics().setDepth(5);
    this.bomb = T(this, W / 2, 190, '☢️', 110, '#fff', { depth: 6 });
    this.tweens.add({ targets: this.bomb, scale: 1.12, yoyo: true, repeat: -1, duration: 400 });
    this.info = T(this, W / 2, 420, '', 22, '#c28aff', { depth: 6 });
    this.newRound();
    this.input.on('pointerdown', () => this.stop());
    this.input.keyboard.on('keydown-SPACE', () => this.stop());
  }

  newRound() {
    const zw = Math.max(0.07, 0.22 - this.round * 0.05);
    this.zone = [Phaser.Math.FloatBetween(0.15, 0.85 - zw), 0];
    this.zone[1] = this.zone[0] + zw;
    this.speed = 0.9 + this.round * 0.45;
    this.info.setText(`폭파 코드 ${this.round + 1} / 3  ·  초록 구간에서 클릭 / 스페이스`);
  }

  stop() {
    if (!this.ready || this.ended) return;
    if (this.pos >= this.zone[0] && this.pos <= this.zone[1]) {
      burst(this, W / 2, 190, ['💥', '✦'], 14, '#ffe14a', 140, 34);
      this.round++;
      this.cameras.main.shake(200, 0.01);
      this.addScore();
      if (!this.ended) this.newRound();
    } else {
      this.hurt();
    }
  }

  tick(dt) {
    this.pos += this.dir * this.speed * dt;
    if (this.pos > 1) { this.pos = 1; this.dir = -1; }
    if (this.pos < 0) { this.pos = 0; this.dir = 1; }
    const x0 = 100, w = W - 200, y = 330;
    const g = this.gfx;
    g.clear();
    g.fillStyle(0x222244, 1).fillRoundedRect(x0, y - 22, w, 44, 10);
    g.fillStyle(0x38ff7a, 0.9).fillRect(x0 + w * this.zone[0], y - 22, w * (this.zone[1] - this.zone[0]), 44);
    g.fillStyle(0xffffff, 1).fillRect(x0 + w * this.pos - 4, y - 36, 8, 72);
    g.lineStyle(3, 0xc28aff, 1).strokeRoundedRect(x0, y - 22, w, 44, 10);
  }
}
