import Phaser from 'phaser';
import { W, H } from './ui.js';
import { Title } from './scenes/Title.js';
import { Cutscene } from './scenes/Cutscene.js';
import { Ending } from './scenes/Ending.js';
import { Typing } from './games/Typing.js';
import { Virus } from './games/Virus.js';
import { Popup } from './games/Popup.js';
import { OsOrder } from './games/OsOrder.js';
import { Dodge } from './games/Dodge.js';
import { Timing } from './games/Timing.js';
import { Whack } from './games/Whack.js';
import { Boss } from './games/Boss.js';

window.__game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: W,
  height: H,
  backgroundColor: '#05060f',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 3 },
  scene: [Title, Cutscene, Typing, Virus, Popup, OsOrder, Dodge, Timing, Whack, Boss, Ending],
});
