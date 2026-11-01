import Phaser from 'phaser';
import { W, H, C, T, css, burst } from '../ui.js';
import { sfx } from '../audio.js';
import { BaseGame } from './BaseGame.js';

// 8장: 최종 보스 클로드 99.0 — 보스를 때리고, 떨어지는 삭제 코드(🔥)는 클릭해서 막는다
const HPW = 320;

export class Boss extends BaseGame {
  constructor() { super('Boss'); }

  setup() {
    this.maxHp = 32;
    this.hp = this.maxHp;
    this.goalN = this.maxHp;
    this.shots = [];
    this.fireT = 1.5;

    T(this, W / 2, 104, '클로드 99.0 진화형 바이러스', 13, css(this.accent), { weight: '700', depth: 6 });
    this.hpG = this.add.graphics().setDepth(6);
    this.drawHp();

    this.boss = T(this, W / 2, 210, '👑', 112, '#fff', { depth: 5 }).setInteractive({ useHandCursor: true });
    this.boss.on('pointerdown', () => {
      if (!this.ready || this.ended) return;
      this.hp--;
      this.score = this.maxHp - this.hp;
      sfx.hit();
      this.boss.setScale(0.92);
      this.tweens.add({ targets: this.boss, scale: 1, duration: 120 });
      burst(this, this.boss.x, this.boss.y, this.accent, 6, 60, 3);
      this.drawHp();
      this.refreshHud();
      if (this.hp <= 0) { burst(this, this.boss.x, this.boss.y, 0xffffff, 30, 200, 5); sfx.boom(); this.win(); }
    });
  }

  drawHp() {
    const g = this.hpG;
    g.clear();
    g.fillStyle(0xffffff, 0.08).fillRoundedRect(W / 2 - HPW / 2, 122, HPW, 6, 3);
    const w = HPW * Math.max(0, this.hp) / this.maxHp;
    if (w > 0) g.fillStyle(C.danger, 1).fillRoundedRect(W / 2 - HPW / 2, 122, w, 6, 3);
  }

  tick(dt, t) {
    const phase = 1 + (this.maxHp - this.hp) / this.maxHp * 1.6;
    this.boss.x = W / 2 + Math.sin(t / 700 * phase) * 320;
    this.boss.y = 220 + Math.sin(t / 450 * phase) * 36;
    this.boss.angle = Math.sin(t / 500) * 6;

    this.fireT -= dt;
    if (this.fireT <= 0) {
      this.fireT = Math.max(0.45, 1.4 - (this.maxHp - this.hp) * 0.03);
      const s = T(this, this.boss.x, this.boss.y + 56, '🔥', 42, '#fff', { depth: 4 }).setInteractive({ useHandCursor: true });
      const o = { s, vy: 150 + (this.maxHp - this.hp) * 4, vx: Phaser.Math.Between(-120, 120) };
      s.on('pointerdown', () => {
        if (!this.ready || this.ended) return;
        burst(this, s.x, s.y, 0xffa94d, 8, 50, 3);
        sfx.pop();
        s.destroy();
        this.shots = this.shots.filter((i) => i !== o);
      });
      this.shots.push(o);
    }
    for (const o of [...this.shots]) {
      o.s.y += o.vy * dt;
      o.s.x += o.vx * dt;
      if (o.s.y > H + 20) {
        o.s.destroy();
        this.shots = this.shots.filter((i) => i !== o);
        this.hurt();
      }
    }
  }

  onTimeUp() { this.lose('보스를 쓰러뜨리지 못했습니다.'); }
}
