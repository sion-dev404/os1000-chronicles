import Phaser from 'phaser';
import { W, C, T, burst } from '../ui.js';
import { BaseGame } from './BaseGame.js';

// 6장: 폭파 게이지 타이밍 맞추기. 3회 성공 / 3회 실패(목숨 소진) 패배
const X0 = 160, BW = W - 320, Y = 340, BH = 16;

export class Timing extends BaseGame {
  constructor() { super('Timing'); }

  setup() {
    this.goalN = 3;
    this.round = 0;
    this.pos = 0;
    this.dir = 1;
    this.gfx = this.add.graphics().setDepth(5);
    this.bomb = T(this, W / 2, 210, '☢️', 96, '#fff', { depth: 6 });
    this.tweens.add({ targets: this.bomb, scale: 1.06, yoyo: true, repeat: -1, duration: 500, ease: 'Sine.easeInOut' });
    this.info = T(this, W / 2, 392, '', 14, C.muted, { depth: 6, weight: '600' });
    T(this, W / 2, 420, '클릭 또는 스페이스', 12, C.dim, { depth: 6 });
    this.newRound();
    this.input.on('pointerdown', () => this.stop());
    this.input.keyboard.on('keydown-SPACE', () => this.stop());
  }

  newRound() {
    const zw = Math.max(0.07, 0.22 - this.round * 0.05);
    const z0 = Phaser.Math.FloatBetween(0.15, 0.85 - zw);
    this.zone = [z0, z0 + zw];
    this.speed = 0.9 + this.round * 0.45;
    this.info.setText(`폭파 코드 ${this.round + 1} / 3`);
  }

  stop() {
    if (!this.ready || this.ended) return;
    if (this.pos >= this.zone[0] && this.pos <= this.zone[1]) {
      burst(this, W / 2, 210, this.accent, 18, 140, 5);
      this.round++;
      this.cameras.main.shake(160, 0.006);
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
    const g = this.gfx;
    g.clear();
    g.fillStyle(0xffffff, 0.08).fillRoundedRect(X0, Y - BH / 2, BW, BH, BH / 2);
    g.fillStyle(C.success, 0.9).fillRoundedRect(X0 + BW * this.zone[0], Y - BH / 2, BW * (this.zone[1] - this.zone[0]), BH, 4);
    g.fillStyle(0xffffff, 1).fillRoundedRect(X0 + BW * this.pos - 3, Y - 20, 6, 40, 3);
  }
}
