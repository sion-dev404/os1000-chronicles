import Phaser from 'phaser';
import { W, H, T, burst } from '../ui.js';
import { sfx } from '../audio.js';
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
    const x = Phaser.Math.Between(50, W - 50);
    const t = T(this, x, 100, bad ? '🦠' : '📁', bad ? 62 : 54, '#fff', { depth: 5 }).setInteractive({ useHandCursor: true });
    const o = { t, bad, vy: 90 + this.score * 9 + Math.random() * 60, wob: Math.random() * 6, x };
    t.on('pointerdown', () => {
      if (this.ended || !this.ready) return;
      if (bad) { burst(this, t.x, t.y, ['✦', '🦠'], 10, '#7aff7a', 80, 22); this.remove(o); this.addScore(); }
      else { burst(this, t.x, t.y, ['💢'], 6, '#ff4a4a', 60, 26); this.remove(o); this.hurt(); }
    });
    this.items.push(o);
  }

  remove(o) { o.t.destroy(); this.items = this.items.filter((i) => i !== o); }

  tick(dt, t) {
    this.spawnT -= dt;
    if (this.spawnT <= 0) { this.spawn(); this.spawnT = Math.max(0.35, 0.95 - this.score * 0.035); }
    for (const o of [...this.items]) {
      o.t.y += o.vy * dt;
      o.t.x = o.x + Math.sin(t / 400 + o.wob) * 22;
      o.t.angle = Math.sin(t / 300 + o.wob) * 12;
      if (o.t.y > H + 20) {
        this.remove(o);
        if (o.bad) this.hurt();
      }
    }
  }
}
