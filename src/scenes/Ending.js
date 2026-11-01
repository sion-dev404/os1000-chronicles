import Phaser from 'phaser';
import { W, H, T, gradientBg, button, Rain, burst, save } from '../ui.js';
import { sfx, bgm } from '../audio.js';

export class Ending extends Phaser.Scene {
  constructor() { super('Ending'); }

  create() {
    save.max = 99;
    gradientBg(this, 0x000000, 0x1a0a3a);
    this.rain = new Rain(this, { chars: '✦✧', color: '#ffe14a', dir: -1, count: 70, alpha: 0.7, size: 26 });
    bgm('epic');
    sfx.fanfare();
    this.cameras.main.fadeIn(800, 255, 255, 255);

    const os = T(this, W / 2, 190, 'OS 1000', 150, '#ffffff', { bold: true, stroke: '#ffe14a', st: 10 }).setScale(0);
    this.tweens.add({ targets: os, scale: 1, duration: 1200, ease: 'Elastic.easeOut' });
    this.tweens.add({ targets: os, angle: 2, yoyo: true, repeat: -1, duration: 1500, ease: 'Sine.easeInOut', delay: 1300 });

    T(this, W / 2, 300, '초차원의 절대 전지전능 운영체제가 깨어났다', 28, '#ffe14a', { bold: true });
    T(this, W / 2, 345, 'THE END', 40, '#ffffff', { bold: true });
    T(this, W / 2, 392, '날씨 앱은 사라졌지만, 당신의 뇌절은 영원하다 ☁️', 20, '#b9c2ff');

    button(this, W / 2 - 150, 460, 250, 58, '↻ 처음부터', () => this.go('Cutscene', { ch: 0 }), 0x2a6cff);
    button(this, W / 2 + 150, 460, 250, 58, '타이틀로', () => this.go('Title'), 0x7a3aff);

    this.time.addEvent({
      delay: 450, loop: true,
      callback: () => burst(this, 120 + Math.random() * (W - 240), 60 + Math.random() * 180, ['✦', '★', '✧', '🎆'], 16, ['#ffe14a', '#ff6ad5', '#6ad7ff', '#8aff6a'][Math.floor(Math.random() * 4)], 110, 28),
    });
  }

  go(key, data) {
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(key, data));
  }

  update(_, dt) { this.rain.update(dt / 1000); }
}
