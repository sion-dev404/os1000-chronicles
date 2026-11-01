import { W, H, T } from '../ui.js';
import { sfx } from '../audio.js';
import { BaseGame } from './BaseGame.js';

// 1장: 꼬인 오타를 정확히 입력 (한글 IME 대응을 위해 실제 <input> 사용)
export class Typing extends BaseGame {
  constructor() { super('Typing'); }

  setup() {
    this.phrases = this.cfg.phrases;
    this.goalN = this.phrases.length;
    this.idx = 0;
    this.box = document.getElementById('typebox');
    this.target = T(this, W / 2, 250, '', 64, '#ffffff', { bold: true, stroke: '#000', st: 6, depth: 5 });
    this.mirror = T(this, W / 2, 330, '', 34, '#9dffb0', { depth: 5 });
    this.hint = T(this, W / 2, 150, '', 18, '#8890c0', { depth: 5 });
    this.onInput = () => {
      const v = this.box.value;
      const want = this.phrases[this.idx];
      this.mirror.setText(v).setColor(want.startsWith(v) ? '#9dffb0' : '#ff6a6a');
      sfx.type();
      if (v.trim() === want) {
        this.idx++;
        this.box.value = '';
        this.mirror.setText('');
        this.target.setScale(1.3);
        this.tweens.add({ targets: this.target, scale: 1, duration: 200 });
        this.score = this.idx;
        sfx.good();
        this.refreshHud();
        if (this.idx >= this.goalN) this.win();
        else this.showPhrase();
      }
    };
    this.box.addEventListener('input', this.onInput);
  }

  onStart() {
    this.box.style.display = 'block';
    this.box.value = '';
    this.box.focus();
    this.showPhrase();
    this.input.on('pointerdown', () => this.box.focus());
  }

  showPhrase() {
    this.target.setText(this.phrases[this.idx]);
    this.hint.setText(`${this.idx + 1} / ${this.goalN}  ·  위 문장을 그대로 입력하세요`);
  }

  tick() {}

  cleanup() {
    this.box.removeEventListener('input', this.onInput);
    this.box.style.display = 'none';
    this.box.blur();
  }

  shutdown() { this.cleanup(); }
  create() { super.create(); this.events.once('shutdown', () => this.cleanup()); }
}
