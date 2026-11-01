import Phaser from 'phaser';
import { W, H, C, T, css, hd, button, burst, save } from '../ui.js';
import { sfx, bgm } from '../audio.js';
import { ENDING } from '../story.js';
import { Sky } from '../sky.js';
import { getWeather } from '../weather.js';

const GOLD = 0xf5c84c;
const SPARKS = [0xf5c84c, 0x6c8cff, 0xa78bfa, 0x4fd1c5];
const SPEED = 34;

// 엔딩: 실제 날씨로 그린 하늘 위로 결말이 크레딧처럼 올라가고, 끝나면 OS 1000 로고
export class Ending extends Phaser.Scene {
  constructor() { super('Ending'); }

  create() {
    save.max = 99;
    hd(this);
    this.done = false;
    this.fast = false;
    this.weather = null;

    // 날씨가 오기 전에는 별이 뜬 밤하늘
    this.sky = new Sky(this, { kind: 'clear', isDay: false });
    // 글자가 잘 보이도록 하늘 위에 옅은 어둠막 (낮 하늘은 더 옅게)
    this.veil = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.32).setDepth(-40);
    bgm('epic');
    sfx.fanfare();
    this.cameras.main.fadeIn(900, 255, 255, 255);

    this.status = T(this, 24, 28, '하늘을 불러오는 중…', 13, '#e6e9f0', { ox: 0, weight: '600', depth: 20 });
    this.shadow(this.status);
    const skip = T(this, W - 24, 28, '건너뛰기  ›', 13, '#e6e9f0', { ox: 1, weight: '600', depth: 20 }).setInteractive({ useHandCursor: true });
    this.shadow(skip);
    skip.on('pointerdown', (p, lx, ly, e) => { e?.stopPropagation?.(); this.finish(); });

    this.buildRoll();
    this.hint = T(this, W / 2, H - 22, '화면을 누르면 빨리 넘어가요', 11, '#c9cfdb', { depth: 20 }).setAlpha(0.7);
    this.input.on('pointerdown', () => { this.fast = !this.fast; });

    getWeather().then((w) => this.applyWeather(w));
  }

  shadow(t) { return t.setShadow(0, 2, 'rgba(0,0,0,0.65)', 8, false, true); }

  buildRoll() {
    this.roll = this.add.container(W / 2, H + 30).setDepth(10);
    let y = 0;
    for (const l of ENDING) {
      if (l.st === 'gap') { y += 22; continue; }
      let t;
      if (l.st === 'code') t = T(this, 0, y, l.t, 17, css(GOLD), { weight: '700' });
      else if (l.st === 'em') t = T(this, 0, y, l.t, 20, '#ffffff', { weight: '800' });
      else if (l.st === 'sky') { t = T(this, 0, y + 14, '오늘의 하늘을 확인하는 중…', 20, css(GOLD), { weight: '800' }); this.skyLine = t; y += 14; }
      else t = T(this, 0, y, l.t, 18, '#eef1f6', { weight: '500' });
      this.shadow(t);
      this.roll.add(t);
      y += 40;
    }
    this.rollH = y;
  }

  skyText(w) {
    if (!w) return '오늘의 하늘 · OS 1000이 직접 그린 밤하늘';
    return `오늘의 하늘 · ${w.place} · ${w.label} ${w.temp}°C`;
  }

  applyWeather(w) {
    if (!this.sys.isActive()) return;
    this.weather = w;
    this.status.setText(w ? `${w.place}의 지금 날씨  ·  ${w.label}  ${w.temp}°C` : '날씨를 불러오지 못해 OS 1000이 하늘을 직접 그렸어요');
    this.skyLine?.setText(this.skyText(w));
    this.finalSky?.setText(this.skyText(w));
    if (!w) return;
    this.tweens.add({ targets: this.veil, alpha: w.isDay ? 0.5 : 1, duration: 1600 });
    const old = this.sky;
    this.sky = new Sky(this, w, -99);
    this.sky.c.setAlpha(0);
    this.tweens.add({ targets: this.sky.c, alpha: 1, duration: 1600, onComplete: () => old.destroy() });
  }

  finish() {
    if (this.done) return;
    this.done = true;
    this.tweens.add({ targets: [this.roll, this.hint], alpha: 0, duration: 500 });
    this.time.delayedCall(400, () => this.showFinal());
  }

  showFinal() {
    sfx.fanfare();
    const items = [];
    items.push(T(this, W / 2, 134, 'THE END', 12, css(GOLD), { weight: '700', ls2: 6 }));
    const os = T(this, W / 2, 202, 'OS 1000', 112, '#ffffff', { weight: '800' });
    items.push(os);
    items.push(T(this, W / 2, 284, '초차원의 운영체제가 날씨를 다시 썼다', 20, css(GOLD), { weight: '700' }));
    this.finalSky = T(this, W / 2, 320, this.skyText(this.weather), 15, '#e6e9f0', { weight: '600' });
    items.push(this.finalSky);
    items.forEach((t, i) => {
      this.shadow(t);
      t.setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, duration: 800, delay: i * 180 });
    });
    os.setScale(0.92);
    this.tweens.add({ targets: os, scale: 1, duration: 1200, ease: 'Cubic.easeOut' });

    button(this, W / 2 - 104, 410, 190, 48, '처음부터', () => this.go('Cutscene', { ch: 0 }), { accent: GOLD });
    button(this, W / 2 + 104, 410, 190, 48, '타이틀로', () => this.go('Title'), { variant: 'ghost' });

    this.time.addEvent({
      delay: 1200, loop: true,
      callback: () => burst(this, 140 + Math.random() * (W - 280), 70 + Math.random() * 110, Phaser.Utils.Array.GetRandom(SPARKS), 14, 80, 3),
    });
  }

  go(key, data) {
    this.cameras.main.fadeOut(350, 11, 13, 20);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(key, data));
  }

  update(_, dt) {
    const s = dt / 1000;
    this.sky?.update(s);
    if (this.done) return;
    this.roll.y -= SPEED * (this.fast ? 5 : 1) * s;
    if (this.roll.y + this.rollH < 60) this.finish();
  }
}
