import Phaser from 'phaser';
import { W, H, C, T, css, hd, backdrop, panel, button, chip, burst, save } from '../ui.js';
import { sfx, bgm } from '../audio.js';
import { CHAPTERS } from '../story.js';
import { CHOICES } from '../choices.js';

// "어떻게 할까?" 선택지 10개 (2열 x 5줄). 실패한 선택지는 지워지고 다시 고른다.
const CW = 420, CH = 56, GAP_Y = 12;
const GOLD = 0xf5c84c;

export class Choice extends Phaser.Scene {
  constructor() { super('Choice'); }

  init(d) { this.ch = d.ch; }

  create() {
    const cfg = (this.cfg = CHAPTERS[this.ch]);
    this.accent = cfg.accent;
    this.busy = false;
    hd(this);
    backdrop(this, this.accent);
    bgm(cfg.mood);
    this.cameras.main.fadeIn(350, 11, 13, 20);

    T(this, W / 2, 46, `CHAPTER ${String(this.ch + 1).padStart(2, '0')}  ·  ${cfg.title}`, 12, css(this.accent), { weight: '700', ls2: 1 });
    T(this, W / 2, 80, '어떻게 할까?', 28, C.text, { weight: '800' });
    T(this, W / 2, 112, '하나를 고르세요. 실패한 선택은 지워지고 다시 고를 수 있어요.', 13, C.muted);

    const back = T(this, 24, 28, '‹  이야기 다시 보기', 13, C.muted, { ox: 0, weight: '600' }).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor(C.text));
    back.on('pointerout', () => back.setColor(C.muted));
    back.on('pointerdown', () => this.scene.start('Cutscene', { ch: this.ch }));

    const list = Phaser.Utils.Array.Shuffle([...CHOICES[this.ch]]);
    list.forEach((c, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = W / 2 + (col ? 1 : -1) * (CW / 2 + 8);
      const y = 168 + row * (CH + GAP_Y);
      this.card(x, y, i, c);
    });
  }

  card(x, y, i, choice) {
    const [, e, label] = choice;
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    const draw = (hover) => {
      g.clear();
      g.fillStyle(hover ? 0x1c2130 : C.surface, 1).fillRoundedRect(-CW / 2, -CH / 2, CW, CH, 14);
      g.lineStyle(1, hover ? this.accent : 0xffffff, hover ? 0.9 : 0.08).strokeRoundedRect(-CW / 2, -CH / 2, CW, CH, 14);
    };
    draw(false);
    c.add([
      g,
      T(this, -CW / 2 + 22, 0, String(i + 1).padStart(2, '0'), 12, css(this.accent), { ox: 0, weight: '700' }),
      T(this, -CW / 2 + 66, 0, e, 24),
      T(this, -CW / 2 + 92, 0, label, 16, C.text, { ox: 0, weight: '600' }),
    ]);
    c.setSize(CW, CH).setInteractive({ useHandCursor: true });
    c.on('pointerover', () => !this.busy && draw(true));
    c.on('pointerout', () => draw(false));
    c.on('pointerdown', () => { if (!this.busy) { draw(false); this.pick(c, choice); } });
    c.setAlpha(0);
    c.y += 10;
    this.tweens.add({ targets: c, alpha: 1, y, duration: 300, delay: 60 + i * 35, ease: 'Cubic.easeOut' });
  }

  tagFor(kind) {
    if (kind === 'go') return ['정공법', this.accent];
    if (kind === 'life') return ['보너스  ·  목숨 +1', C.success];
    if (kind === 'time') {
      if (!this.cfg.time) return ['보너스  ·  목숨 +1', C.success];
      return [this.cfg.game === 'Dodge' ? '보너스  ·  버틸 시간 -5초' : '보너스  ·  시간 +10초', C.success];
    }
    if (kind === 'fail') return ['실패', C.danger];
    return ['기적', GOLD];
  }

  pick(card, [kind, e, label, result]) {
    this.busy = true;
    if (kind === 'fail') sfx.bad();
    else if (kind === 'win') sfx.fanfare();
    else sfx.good();
    if (kind === 'fail') this.cameras.main.shake(180, 0.004);

    const items = [];
    items.push(this.add.rectangle(W / 2, H / 2, W, H, C.bg, 0.78).setDepth(90).setInteractive());
    items.push(panel(this, W / 2, H / 2, 540, 300, { depth: 91, r: 22 }));
    const icon = T(this, W / 2, H / 2 - 82, e, 64, '#fff', { depth: 92 }).setScale(0.5);
    this.tweens.add({ targets: icon, scale: 1, duration: 400, ease: 'Back.easeOut' });
    items.push(icon);
    const [tag, tagColor] = this.tagFor(kind);
    items.push(chip(this, W / 2, H / 2 - 22, tag, tagColor, { depth: 92 }));
    items.push(T(this, W / 2, H / 2 + 22, `“${label}”`, 14, C.muted, { depth: 92, w: 460 }));
    items.push(T(this, W / 2, H / 2 + 56, result, 18, C.text, { depth: 92, weight: '600', w: 460 }));
    if (kind === 'win') burst(this, W / 2, H / 2 - 82, GOLD, 22, 160, 4);

    const close = () => { items.forEach((o) => o.destroy()); this.busy = false; };
    const by = H / 2 + 112;
    if (kind === 'fail') {
      card.disableInteractive();
      this.tweens.add({ targets: card, alpha: 0.28, duration: 300 });
      items.push(button(this, W / 2, by, 200, 46, '다른 선택', close, { variant: 'ghost', depth: 93 }));
    } else if (kind === 'win') {
      items.push(button(this, W / 2, by, 200, 46, '다음 장으로', () => {
        save.max = Math.max(save.max, this.ch + 1);
        this.go('Cutscene', { ch: this.ch + 1 });
      }, { accent: GOLD, depth: 93 }));
    } else {
      const mod = kind === 'go' ? null : kind;
      items.push(button(this, W / 2, by, 200, 46, '미니게임 시작', () => this.go(this.cfg.game, { ch: this.ch, mod }), { accent: this.accent, depth: 93 }));
    }
  }

  go(key, data) {
    this.cameras.main.fadeOut(350, 11, 13, 20);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(key, data));
  }
}
