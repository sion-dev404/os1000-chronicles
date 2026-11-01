import Phaser from 'phaser';
import { W, H, T, gradientBg, button, Rain, save } from '../ui.js';
import { sfx, bgm, toggleMute, isMuted } from '../audio.js';
import { CHAPTERS } from '../story.js';

export class Title extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    gradientBg(this, 0x050818, 0x1a0a30);
    this.rain = new Rain(this, { chars: '01ㅆㅂ윈도우', color: '#2cff6a', count: 60, alpha: 0.5 });

    this.logo = T(this, W / 2, 130, 'OS 1000', 110, '#ffe14a', { bold: true, stroke: '#ff7a00', st: 8 });
    T(this, W / 2, 205, '오타에서 시작된 뇌절 대서사시', 30, '#ffffff', { bold: true });
    this.tweens.add({ targets: this.logo, scale: 1.06, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' });

    button(this, W / 2, 285, 300, 62, '▶ 처음부터 시작', () => this.begin(0), 0x2a6cff, 28);

    const max = Math.min(save.max, CHAPTERS.length - 1);
    if (max > 0) {
      T(this, W / 2, 350, '챕터 선택', 20, '#9aa7ff');
      const n = max + 1;
      const gap = 62;
      for (let i = 0; i < n; i++) {
        const x = W / 2 - ((n - 1) * gap) / 2 + i * gap;
        button(this, x, 392, 52, 46, String(i + 1), () => this.begin(i), 0x7a3aff, 22);
      }
    } else {
      T(this, W / 2, 360, '챕터를 클리어하면 챕터 선택이 열립니다', 18, '#8890c0');
    }

    T(this, W / 2, H - 28, '클릭 · 터치 · 키보드로 즐기는 7+1장 미니게임 · 컷신 영상 포함', 16, '#8890c0');

    this.mute = T(this, W - 30, 28, isMuted() ? '🔇' : '🔊', 30).setInteractive({ useHandCursor: true }).setDepth(100);
    this.mute.on('pointerdown', () => { const m = toggleMute(); this.mute.setText(m ? '🔇' : '🔊'); if (!m) bgm('calm'); });
    bgm('calm');
  }

  begin(ch) {
    sfx.unlock();
    sfx.fanfare();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Cutscene', { ch }));
  }

  update(_, dt) { this.rain.update(dt / 1000); }
}
