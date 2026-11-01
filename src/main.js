import Phaser from 'phaser';
import 'pretendard/dist/web/static/pretendard-subset.css';
import { W, H, S } from './ui.js';
import { Title } from './scenes/Title.js';
import { Cutscene } from './scenes/Cutscene.js';
import { Choice } from './scenes/Choice.js';
import { Ending } from './scenes/Ending.js';
import { Spell } from './games/Spell.js';
import { Virus } from './games/Virus.js';
import { Popup } from './games/Popup.js';
import { OsOrder } from './games/OsOrder.js';
import { Dodge } from './games/Dodge.js';
import { Timing } from './games/Timing.js';
import { Whack } from './games/Whack.js';
import { Boss } from './games/Boss.js';

// 캔버스 글자는 폰트가 늦게 오면 다시 그려지지 않으므로, 쓰는 굵기를 미리 받아둔다
const fontsReady = Promise.race([
  Promise.all(['400', '500', '600', '700', '800'].map((w) => document.fonts.load(`${w} 16px Pretendard`, '가A1'))),
  new Promise((r) => setTimeout(r, 3000)),
]).catch(() => {});

fontsReady.then(() => {
  window.__game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'app',
    width: W * S,
    height: H * S,
    backgroundColor: '#0b0d14',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { activePointers: 3 },
    scene: [Title, Cutscene, Choice, Spell, Virus, Popup, OsOrder, Dodge, Timing, Whack, Boss, Ending],
  });
});
