import Phaser from 'phaser';
import { W, H, C, T, css, hd, backdrop, button, Rain, save } from '../ui.js';
import { sfx, bgm, toggleMute, isMuted } from '../audio.js';
import { CHAPTERS } from '../story.js';
import { CLAUDE, STAGES } from '../arc.js';

const GOLD = 0xf5c84c;

export class Title extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    hd(this);
    backdrop(this, GOLD);
    this.rain = new Rain(this, { chars: '01', count: 24, alpha: 0.1 });

    T(this, W / 2, 120, 'THE CHRONICLES OF SYSTEM CRASH', 12, css(GOLD), { weight: '700', ls2: 4 });
    this.logo = T(this, W / 2, 182, 'OS 1000', 88, C.text, { weight: '800' });
    T(this, W / 2, 248, '오타에서 시작된 뇌절 대서사시', 18, C.muted);

    button(this, W / 2, 316, 220, 52, '시작하기', () => this.begin(0), { accent: GOLD, size: 18 });

    const unlocked = Math.min(save.max, CHAPTERS.length - 2);
    if (unlocked > 0) {
      T(this, W / 2, 380, '챕터 선택', 12, C.dim);
      const n = unlocked + 1;
      const gap = 52;
      for (let i = 0; i < n; i++) {
        const x = W / 2 - ((n - 1) * gap) / 2 + i * gap;
        button(this, x, 414, 42, 42, String(i + 1), () => this.begin(i), { variant: 'ghost', size: 15 });
      }
    }

    // OS 1000 엔딩을 본 뒤에는 클로드 리버스 편을 바로 이어 할 수 있다
    if (save.max >= 99) {
      const stage = save.rebirth >= STAGES.length ? 0 : save.rebirth;
      button(this, W / 2, 470, 260, 40, `✻  클로드 리버스  ${save.rebirth >= STAGES.length ? '(완료)' : `${stage + 1} / ${STAGES.length}`}`,
        () => this.scene.start('Duel', { stage }), { accent: CLAUDE, size: 14 });
    }

    T(this, W / 2, H - 22, '8개의 장 + 클로드 리버스 10장면 · 터치와 클릭만으로 플레이', 12, C.dim);

    this.mute = T(this, W - 28, 28, '', 13, C.muted, { ox: 1, weight: '600' }).setInteractive({ useHandCursor: true });
    const label = () => this.mute.setText(isMuted() ? '소리 끔' : '소리 켬');
    label();
    this.mute.on('pointerdown', () => { const m = toggleMute(); label(); if (!m) bgm('calm'); });
    bgm('calm');
  }

  begin(ch) {
    sfx.unlock();
    sfx.fanfare();
    this.cameras.main.fadeOut(400, 11, 13, 20);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Cutscene', { ch }));
  }

  update(_, dt) { this.rain.update(dt / 1000); }
}
