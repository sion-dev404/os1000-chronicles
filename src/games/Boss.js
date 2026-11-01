import Phaser from 'phaser';
import { W, H, T, burst } from '../ui.js';
import { sfx } from '../audio.js';
import { BaseGame } from './BaseGame.js';

// 8장: 최종 보스 클로드 99.0 — 보스를 때리고, 떨어지는 삭제 코드(🔥)는 클릭해서 막는다
export class Boss extends BaseGame {
  constructor() { super('Boss'); }

  setup() {
    this.maxHp = 32;
    this.hp = this.maxHp;
    this.goalN = this.maxHp;
    this.shots = [];
    this.fireT = 1.5;
    this.boss = T(this, W / 2, 190, '👑', 130, '#fff', { depth: 5 }).setInteractive({ useHandCursor: true });
    this.bossName = T(this, W / 2, 112, '클로드 99.0 진화형 바이러스', 20, '#ffcc66', { depth: 6, bold: true });
    this.boss.on('pointerdown', () => {
      if (!this.ready || this.ended) return;
      this.hp--;
      this.score = this.maxHp - this.hp;
      sfx.hit();
      this.boss.setScale(0.9);
      this.tweens.add({ targets: this.boss, scale: 1, duration: 120 });
      burst(this, this.boss.x + Phaser.Math.Between(-40, 40), this.boss.y + Phaser.Math.Between(-30, 30), ['✦', '💢'], 4, '#ffe14a', 60, 24);
      this.refreshHud();
      if (this.hp <= 0) { burst(this, this.boss.x, this.boss.y, ['💥', '🔥', '✦'], 30, '#ffffff', 220, 40); sfx.boom(); this.win(); }
    });
  }

  tick(dt, t) {
    const phase = 1 + (this.maxHp - this.hp) / this.maxHp * 1.6;
    this.boss.x = W / 2 + Math.sin(t / 700 * phase) * 330;
    this.boss.y = 190 + Math.sin(t / 450 * phase) * 40;
    this.boss.angle = Math.sin(t / 500) * 8;

    this.fireT -= dt;
    if (this.fireT <= 0) {
      this.fireT = Math.max(0.45, 1.4 - (this.maxHp - this.hp) * 0.03);
      const s = T(this, this.boss.x, this.boss.y + 60, '🔥', 52, '#fff', { depth: 4 }).setInteractive({ useHandCursor: true });
      const o = { s, vy: 150 + (this.maxHp - this.hp) * 4, vx: Phaser.Math.Between(-120, 120) };
      s.on('pointerdown', () => {
        if (!this.ready || this.ended) return;
        burst(this, s.x, s.y, ['✦'], 6, '#ffaa33', 60, 22);
        sfx.pop();
        s.destroy();
        this.shots = this.shots.filter((i) => i !== o);
      });
      this.shots.push(o);
    }
    for (const o of [...this.shots]) {
      o.s.y += o.vy * dt;
      o.s.x += o.vx * dt;
      o.s.angle += 120 * dt;
      if (o.s.y > H + 20) {
        o.s.destroy();
        this.shots = this.shots.filter((i) => i !== o);
        this.hurt();
      }
    }
    // 보스 HP를 진행바 대신 표시
    this.hudGoal.setText(`보스 HP ${'█'.repeat(Math.ceil(this.hp / 2))}${'░'.repeat(Math.floor((this.maxHp - this.hp) / 2))}`);
  }

  onTimeUp() { this.lose('보스를 쓰러뜨리지 못했다...'); }
}
