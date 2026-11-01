import Phaser from 'phaser';
import { W, H, C, T, burst } from '../ui.js';
import { BaseGame } from './BaseGame.js';

// 2장: 바이러스만 클릭, 파일은 클릭 금지
export class Virus extends BaseGame {
  constructor() { super('Virus'); }

  setup() {
    this.goalN = 15;
    this.items = [];
    this.spawnT = 0;
  }

  spawn() {
    const bad = Math.random() < 0.72;
    const x = Phaser.Math.Between(60, W - 60);
    const t = T(this, x, 96, bad ? '🦠' : '📁', bad ? 54 : 46, '#fff', { depth: 5 }).setInteractive({ useHandCursor: true });
    const o = { t, bad, vy: 80 + this.score * 8 + Math.random() * 50, wob: Math.random() * 6, x };
    t.on('pointerdown', () => {
      if (this.ended || !this.ready) return;
      this.remove(o);
      if (bad) { burst(this, t.x, t.y, this.accent, 12, 70); this.addScore(); }
      else { burst(this, t.x, t.y, C.danger, 8, 50); this.hurt(); }
    });
    this.items.push(o);
  }

  remove(o) { o.t.destroy(); this.items = this.items.filter((i) => i !== o); }

  tick(dt, t) {
    this.spawnT -= dt;
    if (this.spawnT <= 0) { this.spawn(); this.spawnT = Math.max(0.35, 0.95 - this.score * 0.035); }
    for (const o of [...this.items]) {
      o.t.y += o.vy * dt;
      o.t.x = o.x + Math.sin(t / 400 + o.wob) * 18;
      o.t.angle = Math.sin(t / 300 + o.wob) * 8;
      if (o.t.y > H + 20) {
        this.remove(o);
        if (o.bad) this.hurt();
      }
    }
  }
}
