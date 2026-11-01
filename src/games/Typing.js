import { W, C, T, css, burst } from '../ui.js';
import { sfx } from '../audio.js';
import { BaseGame } from './BaseGame.js';

// 1장: 꼬인 오타를 정확히 입력 (한글 IME 대응을 위해 실제 <input> 사용)
export class Typing extends BaseGame {
  constructor() { super('Typing'); }

  create() {
    super.create();
    this.events.once('shutdown', () => this.cleanup());
  }

  setup() {
    this.phrases = this.cfg.phrases;
    this.goalN = this.phrases.length;
    this.idx = 0;
    this.box = document.getElementById('typebox');
    this.box.style.setProperty('--accent', css(this.accent));
    this.step = T(this, W / 2, 170, '', 13, C.muted, { weight: '600' });
    this.target = T(this, W / 2, 240, '', 52, C.text, { weight: '800' });
    this.onInput = () => {
      const v = this.box.value;
      const want = this.phrases[this.idx];
      this.box.style.color = want.startsWith(v) ? C.text : css(C.danger);
      sfx.type();
      if (v.trim() !== want) return;
      this.idx++;
      this.box.value = '';
      this.box.style.color = C.text;
      burst(this, W / 2, 240, this.accent, 16, 160, 4);
      this.score = this.idx;
      sfx.good();
      this.refreshHud();
      if (this.idx >= this.goalN) this.win();
      else this.showPhrase();
    };
    this.box.addEventListener('input', this.onInput);
  }

  // 캔버스 좌표 (W/2, 390)에 360x52 크기로 입력창을 맞춘다
  place() {
    const r = this.game.canvas.getBoundingClientRect();
    const k = r.width / W;
    Object.assign(this.box.style, {
      left: `${r.left + r.width / 2}px`, top: `${r.top + 390 * k}px`,
      width: `${360 * k}px`, height: `${52 * k}px`, fontSize: `${20 * k}px`,
    });
  }

  onStart() {
    this.place();
    this.scale.on('resize', this.place, this);
    this.box.style.display = 'block';
    this.box.value = '';
    this.box.focus();
    this.showPhrase();
    this.input.on('pointerdown', () => this.box.focus());
  }

  showPhrase() {
    this.step.setText(`${this.idx + 1} / ${this.goalN}`);
    this.target.setText(this.phrases[this.idx]).setAlpha(0);
    this.tweens.add({ targets: this.target, alpha: 1, duration: 250 });
  }

  tick() {}

  cleanup() {
    this.scale.off('resize', this.place, this);
    this.box.removeEventListener('input', this.onInput);
    this.box.style.display = 'none';
    this.box.blur();
  }
}
