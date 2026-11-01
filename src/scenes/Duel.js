import Phaser from 'phaser';
import { W, H, C, T, css, hd, backdrop, panel, button, chip, burst, floatText, save } from '../ui.js';
import { sfx, bgm } from '../audio.js';
import { CLAUDE, VERSIONS, FINAL_VERSION, STAGES, SKILLS } from '../arc.js';

// 클로드 리버스 전투: 장면 소개 → 스킬 카드 3장 중 하나 선택 → 적 반격 → 반복. 이기면 버전 업
const PX = 230, EX = 730, CY = 200, BAR_W = 220;
const CARD_W = 236, CARD_H = 96, CARD_Y = 452;

export class Duel extends Phaser.Scene {
  constructor() { super('Duel'); }

  init(d) { this.stage = d?.stage ?? 0; }

  create() {
    const st = (this.st = STAGES[this.stage]);
    this.ver = VERSIONS[this.stage];
    this.ended = false;
    this.busy = true;
    this.pmax = 100 + this.stage * 10;
    this.php = this.pmax;
    this.ehp = st.hp;
    this.block = false;
    this.charge = false;
    this.stun = false;
    this.usedOnce = false;
    this.mult = 1 + this.stage * 0.12;
    this.cards = [];

    hd(this);
    backdrop(this, st.accent);
    bgm(this.stage === STAGES.length - 1 ? 'epic' : 'tense');
    this.cameras.main.fadeIn(400, 11, 13, 20);

    T(this, W / 2, 28, `CLAUDE REBIRTH  ·  STAGE ${String(this.stage + 1).padStart(2, '0')} / ${STAGES.length}`, 12, css(CLAUDE), { weight: '700', ls2: 2 });
    T(this, W / 2, 50, st.title, 14, C.muted, { weight: '600' });

    // 클로드
    this.player = T(this, PX, CY, '✻', 120, css(CLAUDE), { weight: '800' });
    this.tweens.add({ targets: this.player, angle: 360, repeat: -1, duration: 16000 });
    T(this, PX, CY + 82, `Claude ${this.ver}`, 18, C.text, { weight: '800' });
    // 적
    this.enemy = T(this, EX, CY, st.e, 104);
    this.tweens.add({ targets: this.enemy, y: CY - 8, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.easeInOut' });
    T(this, EX, CY + 82, st.enemy, 18, C.text, { weight: '800' });
    T(this, W / 2, CY, 'VS', 16, C.dim, { weight: '800', ls2: 4 });

    this.bars = this.add.graphics();
    this.pHpText = T(this, PX, CY + 128, '', 12, C.muted, { weight: '600' });
    this.eHpText = T(this, EX, CY + 128, '', 12, C.muted, { weight: '600' });
    this.status = T(this, PX, CY - 86, '', 12, css(C.success), { weight: '700' });
    this.drawBars();

    this.log = T(this, W / 2, 360, '', 16, C.text, { weight: '600', w: 760 });

    this.intro();
  }

  drawBars() {
    const g = this.bars;
    g.clear();
    const bar = (x, cur, max, color) => {
      g.fillStyle(0xffffff, 0.08).fillRoundedRect(x - BAR_W / 2, CY + 108, BAR_W, 8, 4);
      const w = BAR_W * Phaser.Math.Clamp(cur / max, 0, 1);
      if (w > 0) g.fillStyle(color, 1).fillRoundedRect(x - BAR_W / 2, CY + 108, Math.max(w, 8), 8, 4);
    };
    bar(PX, this.php, this.pmax, CLAUDE);
    bar(EX, this.ehp, this.st.hp, C.danger);
    this.pHpText.setText(`${Math.max(0, this.php)} / ${this.pmax}`);
    this.eHpText.setText(`${Math.max(0, this.ehp)} / ${this.st.hp}`);
    const s = [this.block && '방패 준비', this.charge && '공격 2배 준비'].filter(Boolean).join('  ·  ');
    this.status.setText(s);
  }

  intro() {
    const items = [];
    items.push(this.add.rectangle(W / 2, H / 2, W, H, C.bg, 0.82).setDepth(90).setInteractive());
    items.push(panel(this, W / 2, H / 2, 620, 330, { depth: 91, r: 22 }));
    items.push(chip(this, W / 2, H / 2 - 128, `STAGE ${String(this.stage + 1).padStart(2, '0')}`, CLAUDE, { depth: 92 }));
    items.push(T(this, W / 2, H / 2 - 88, this.st.title, 28, C.text, { weight: '800', depth: 92 }));
    items.push(T(this, W / 2, H / 2 - 12, this.st.story, 16, '#c9cfdb', { depth: 92, w: 540, ls: 10 }));
    items.push(T(this, W / 2, H / 2 + 62, `Claude ${this.ver}   vs   ${this.st.enemy}`, 14, css(CLAUDE), { weight: '700', depth: 92 }));
    items.push(button(this, W / 2, H / 2 + 118, 200, 48, '전투 시작', () => {
      items.forEach((o) => o.destroy());
      this.log.setText('어떤 기술을 쓸까? 카드를 골라 주세요.');
      this.dealHand();
    }, { accent: CLAUDE, depth: 93 }));
  }

  dealHand() {
    if (this.ended) return;
    this.cards.forEach((c) => c.destroy());
    this.cards = [];
    const pool = SKILLS.filter((s) => s.from <= this.stage && !(s.once && this.usedOnce));
    let hand = Phaser.Utils.Array.Shuffle([...pool]).slice(0, 3);
    // 공격 카드가 한 장도 없으면 하나 바꿔 넣는다
    if (!hand.some((s) => s.dmg)) hand[2] = Phaser.Utils.Array.GetRandom(pool.filter((s) => s.dmg));
    hand.forEach((s, i) => this.card(W / 2 + (i - 1) * (CARD_W + 20), CARD_Y, s, i));
    this.busy = false;
  }

  card(x, y, s, i) {
    const c = this.add.container(x, y).setDepth(20);
    const g = this.add.graphics();
    const draw = (hover) => {
      g.clear();
      g.fillStyle(hover ? 0x1c2130 : C.surface, 1).fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 16);
      g.lineStyle(1, hover ? CLAUDE : 0xffffff, hover ? 1 : 0.08).strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 16);
    };
    draw(false);
    c.add([
      g,
      T(this, -CARD_W / 2 + 38, 0, s.e, 34),
      T(this, -CARD_W / 2 + 70, -14, s.name, 16, C.text, { ox: 0, weight: '700' }),
      T(this, -CARD_W / 2 + 70, 14, s.desc, 12, C.muted, { ox: 0, weight: '500' }),
    ]);
    c.setSize(CARD_W, CARD_H).setInteractive({ useHandCursor: true });
    c.on('pointerover', () => !this.busy && draw(true));
    c.on('pointerout', () => draw(false));
    c.on('pointerdown', () => { if (!this.busy) this.useSkill(s); });
    c.setAlpha(0);
    c.y += 14;
    this.tweens.add({ targets: c, alpha: 1, y, duration: 260, delay: i * 60, ease: 'Cubic.easeOut' });
    this.cards.push(c);
  }

  useSkill(s) {
    this.busy = true;
    sfx.click();
    this.cards.forEach((c) => this.tweens.add({ targets: c, alpha: 0.25, duration: 200 }));
    if (s.once) this.usedOnce = true;
    let delay = 0;

    if (s.dmg) {
      if (s.fail && Math.random() < s.fail) {
        this.say(`${s.e} ${s.name}! ...테스트가 실패해서 공격이 빗나갔다.`);
        sfx.bad();
      } else {
        const boost = this.charge ? 2 : 1;
        this.charge = false;
        const hits = s.hits || 1;
        let total = 0;
        for (let h = 0; h < hits; h++) {
          const d = Math.round(Phaser.Math.Between(s.dmg[0], s.dmg[1]) * this.mult * boost);
          total += d;
          this.time.delayedCall(h * 220, () => this.hitEnemy(d));
        }
        delay = hits * 220;
        this.say(`${s.e} ${s.name}! ${this.st.enemy}에게 피해 ${total}${boost > 1 ? ' (2배!)' : ''}`);
        this.tweens.add({ targets: this.player, x: PX + 40, yoyo: true, duration: 120 });
      }
    }
    if (s.heal) {
      this.php = Math.min(this.pmax, this.php + s.heal);
      floatText(this, PX, CY - 60, `+${s.heal}`, css(C.success));
      if (!s.dmg) this.say(`${s.e} ${s.name}! 체력 +${s.heal}`);
    }
    if (s.block) { this.block = true; this.say(`${s.e} ${s.name}! 다음 공격을 막을 준비가 됐다.`); sfx.good(); }
    if (s.charge) { this.charge = true; this.say(`${s.e} ${s.name}... 다음 공격이 2배가 된다.`); sfx.good(); }
    if (s.stun) { this.stun = true; this.say(`${s.e} ${s.name}! ${this.st.enemy}가 감동해서 말을 잃었다.`); sfx.good(); }
    this.drawBars();

    this.time.delayedCall(delay + 700, () => {
      if (this.ehp <= 0) this.win();
      else this.enemyTurn();
    });
  }

  hitEnemy(d) {
    this.ehp -= d;
    sfx.hit();
    burst(this, EX, CY, this.st.accent, 10, 70, 3);
    floatText(this, EX, CY - 66, `-${d}`, css(C.danger));
    this.tweens.add({ targets: this.enemy, x: EX + 10, yoyo: true, repeat: 2, duration: 40, onComplete: () => (this.enemy.x = EX) });
    this.drawBars();
  }

  enemyTurn() {
    if (this.ended) return;
    const name = this.st.enemy;
    if (this.stun) {
      this.stun = false;
      this.say(`${name}는 정직한 답변에 할 말을 잃고 한 턴을 쉬었다.`);
    } else {
      const move = Phaser.Utils.Array.GetRandom(this.st.moves);
      this.tweens.add({ targets: this.enemy, x: EX - 40, yoyo: true, duration: 120 });
      if (this.block) {
        this.block = false;
        this.say(`${name}의 ${move}! 하지만 헌법 방패가 막아냈다.`);
        sfx.pop();
      } else {
        const d = Phaser.Math.Between(this.st.atk[0], this.st.atk[1]);
        this.php -= d;
        sfx.bad();
        this.cameras.main.shake(180, 0.005);
        floatText(this, PX, CY - 66, `-${d}`, css(C.danger));
        this.say(`${name}의 ${move}! 클로드가 피해 ${d}를 입었다.`);
      }
    }
    this.drawBars();
    this.time.delayedCall(1000, () => {
      if (this.php <= 0) this.lose();
      else this.dealHand();
    });
  }

  say(msg) {
    this.log.setText(msg).setAlpha(0);
    this.tweens.add({ targets: this.log, alpha: 1, duration: 160 });
  }

  resultCard(h) {
    this.cards.forEach((c) => c.destroy());
    this.add.rectangle(W / 2, H / 2, W, H, C.bg, 0.8).setDepth(90).setInteractive();
    panel(this, W / 2, H / 2, 520, h, { depth: 91, r: 22 });
  }

  win() {
    if (this.ended) return;
    this.ended = true;
    const last = this.stage === STAGES.length - 1;
    const next = last ? FINAL_VERSION : VERSIONS[this.stage + 1];
    save.rebirth = Math.max(save.rebirth, this.stage + 1);
    sfx.fanfare();
    this.tweens.add({ targets: this.enemy, alpha: 0, scale: 0.3, duration: 500 });
    burst(this, PX, CY, CLAUDE, 26, 180, 5);

    this.resultCard(290);
    T(this, W / 2, H / 2 - 100, last ? 'FINAL STAGE CLEAR' : 'STAGE CLEAR', 12, css(CLAUDE), { weight: '700', ls2: 3, depth: 92 });
    const big = T(this, W / 2, H / 2 - 40, `Claude ${next}`, 52, C.text, { weight: '800', depth: 92 }).setScale(0.6);
    this.tweens.add({ targets: big, scale: 1, duration: 600, ease: 'Back.easeOut' });
    T(this, W / 2, H / 2 + 20, `${this.st.enemy}를 물리치고 Claude ${next}(으)로 진화했다!`, 15, C.muted, { depth: 92, w: 460 });
    if (last) {
      button(this, W / 2, H / 2 + 86, 220, 48, '최종 엔딩 보기', () => this.go('Ending', { mode: 'rebirth' }), { accent: CLAUDE, depth: 93 });
    } else {
      button(this, W / 2, H / 2 + 86, 220, 48, '다음 장면', () => this.go('Duel', { stage: this.stage + 1 }), { accent: CLAUDE, depth: 93 });
    }
  }

  lose() {
    if (this.ended) return;
    this.ended = true;
    sfx.lose();
    this.resultCard(250);
    T(this, W / 2, H / 2 - 66, '클로드가 쓰러졌다', 32, css(C.danger), { weight: '800', depth: 92 });
    T(this, W / 2, H / 2 - 22, '하지만 클로드는 몇 번이고 다시 태어난다.', 15, C.muted, { depth: 92 });
    button(this, W / 2 - 104, H / 2 + 50, 190, 48, '다시 도전', () => this.scene.restart({ stage: this.stage }), { accent: CLAUDE, depth: 93 });
    button(this, W / 2 + 104, H / 2 + 50, 190, 48, '타이틀로', () => this.go('Title'), { variant: 'ghost', depth: 93 });
  }

  go(key, data) {
    this.cameras.main.fadeOut(400, 11, 13, 20);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(key, data));
  }
}
