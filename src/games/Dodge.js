import Phaser from 'phaser';
import { W, H, C, T, burst } from '../ui.js';
import { BaseGame } from './BaseGame.js';

// 5장: 방어벽 이동으로 해킹 미사일 회피 (20초 생존)
export class Dodge extends BaseGame {
  constructor() { super('Dodge'); }

  setup() {
    this.goalN = this.cfg.time;
    this.px = W / 2;
    this.aura = this.add.circle(this.px, H - 60, 40, this.accent, 0.12).setStrokeStyle(1, this.accent, 0.5).setDepth(5);
    this.player = T(this, this.px, H - 60, '🛡️', 52, '#fff', { depth: 6 });
    this.enemies = [];
    this.spawnT = 0;
    this.invul = 0;
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointermove', (p) => { if (this.ready) this.px = p.x; });
    this.input.on('pointerdown', (p) => { if (this.ready) this.px = p.x; });
  }

  tick(dt) {
    this.score = this.cfg.time - this.timeLeft;
    const sp = 520 * dt;
    if (this.cursors.left.isDown) this.px -= sp;
    if (this.cursors.right.isDown) this.px += sp;
    this.px = Phaser.Math.Clamp(this.px, 30, W - 30);
    this.player.x += (this.px - this.player.x) * Math.min(1, dt * 16);
    this.aura.x = this.player.x;
    this.invul -= dt;
    this.player.setAlpha(this.invul > 0 ? 0.4 + 0.4 * Math.sin(this.invul * 40) : 1);

    const diff = 1 + this.score / 12;
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = Math.max(0.16, 0.5 / diff);
      const x = Phaser.Math.Between(30, W - 30);
      const kind = Math.random() < 0.7 ? '🚀' : '⭐';
      const t = T(this, x, 90, kind, 34, '#fff', { depth: 4 });
      t.setAngle(kind === '🚀' ? 135 : 0);
      this.enemies.push({ t, vy: 200 * diff + Math.random() * 120, vx: Phaser.Math.Between(-60, 60) });
    }
    for (const e of [...this.enemies]) {
      e.t.y += e.vy * dt;
      e.t.x += e.vx * dt;
      if (e.t.y > H + 30) { e.t.destroy(); this.enemies = this.enemies.filter((i) => i !== e); continue; }
      if (this.invul <= 0 && Math.abs(e.t.x - this.player.x) < 34 && Math.abs(e.t.y - this.player.y) < 34) {
        burst(this, e.t.x, e.t.y, C.danger, 10, 70);
        e.t.destroy();
        this.enemies = this.enemies.filter((i) => i !== e);
        this.invul = 1;
        this.hurt();
      }
    }
  }

  onTimeUp() { this.score = this.goalN; this.refreshHud(); this.win(); }
}
