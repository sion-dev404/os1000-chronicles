import Phaser from 'phaser';
import { W, C, T, burst } from '../ui.js';
import { sfx } from '../audio.js';
import { BaseGame } from './BaseGame.js';

// 7장: 두더지 잡기 — 서버(🖥️)는 파괴, 아군 위성(🛰️)은 금지
export class Whack extends BaseGame {
  constructor() { super('Whack'); }

  setup() {
    this.goalN = 18;
    this.holes = [];
    const g = this.add.graphics().setDepth(1);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const x = W / 2 + (c - 1.5) * 180;
        const y = 180 + r * 118;
        g.fillStyle(0x000000, 0.35).fillEllipse(x, y + 34, 112, 26);
        g.lineStyle(1, 0xffffff, 0.06).strokeEllipse(x, y + 34, 112, 26);
        const t = T(this, x, y, '', 64, '#fff', { depth: 3 }).setInteractive({ useHandCursor: true }).setVisible(false);
        const h = { t, x, y, life: 0, kind: null };
        t.on('pointerdown', () => this.hit(h));
        this.holes.push(h);
      }
    }
    this.spawnT = 0;
  }

  hit(h) {
    if (!this.ready || this.ended || !h.kind) return;
    const k = h.kind;
    h.kind = null;
    h.t.setVisible(false);
    if (k === 'srv') { burst(this, h.x, h.y, this.accent, 12, 80); sfx.hit(); this.addScore(); }
    else { burst(this, h.x, h.y, C.danger, 8, 60); this.hurt(); }
  }

  tick(dt) {
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = Math.max(0.28, 0.75 - this.score * 0.025);
      const free = this.holes.filter((h) => !h.kind);
      if (free.length) {
        const h = Phaser.Utils.Array.GetRandom(free);
        h.kind = Math.random() < 0.78 ? 'srv' : 'sat';
        h.life = Math.max(0.7, 1.4 - this.score * 0.025);
        h.t.setText(h.kind === 'srv' ? '🖥️' : '🛰️').setVisible(true).setScale(0.4).setY(h.y + 16);
        this.tweens.add({ targets: h.t, scale: 1, y: h.y, duration: 140, ease: 'Back.easeOut' });
      }
    }
    for (const h of this.holes) {
      if (!h.kind) continue;
      h.life -= dt;
      if (h.life <= 0) { h.kind = null; h.t.setVisible(false); }
    }
  }
}
