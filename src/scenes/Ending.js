import Phaser from 'phaser';
import { W, H, C, T, css, hd, backdrop, button, Rain, burst, save } from '../ui.js';
import { sfx, bgm } from '../audio.js';

const GOLD = 0xf5c84c;
const SPARKS = [0xf5c84c, 0x6c8cff, 0xa78bfa, 0x4fd1c5];

export class Ending extends Phaser.Scene {
  constructor() { super('Ending'); }

  create() {
    save.max = 99;
    hd(this);
    backdrop(this, GOLD);
    this.rain = new Rain(this, { chars: '·✦', color: css(GOLD), dir: -1, count: 30, alpha: 0.25 });
    bgm('epic');
    sfx.fanfare();
    this.cameras.main.fadeIn(900, 255, 255, 255);

    T(this, W / 2, 128, 'EPILOGUE', 12, css(GOLD), { weight: '700', ls2: 4 });
    const os = T(this, W / 2, 200, 'OS 1000', 112, C.text, { weight: '800' }).setAlpha(0).setScale(0.9);
    this.tweens.add({ targets: os, alpha: 1, scale: 1, duration: 1200, ease: 'Cubic.easeOut' });

    T(this, W / 2, 284, '초차원의 절대 전지전능 운영체제가 깨어났다', 20, css(GOLD), { weight: '700' });
    T(this, W / 2, 318, '날씨 앱은 사라졌지만, 당신의 뇌절은 영원하다', 15, C.muted);
    T(this, W / 2, 360, 'THE END', 12, C.dim, { weight: '700', ls2: 6 });

    button(this, W / 2 - 104, 436, 190, 48, '처음부터', () => this.go('Cutscene', { ch: 0 }), { accent: GOLD });
    button(this, W / 2 + 104, 436, 190, 48, '타이틀로', () => this.go('Title'), { variant: 'ghost' });

    this.time.addEvent({
      delay: 1100, loop: true,
      callback: () => burst(this, 140 + Math.random() * (W - 280), 70 + Math.random() * 120, Phaser.Utils.Array.GetRandom(SPARKS), 14, 80, 3),
    });
  }

  go(key, data) {
    this.cameras.main.fadeOut(350, 11, 13, 20);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(key, data));
  }

  update(_, dt) { this.rain.update(dt / 1000); }
}
