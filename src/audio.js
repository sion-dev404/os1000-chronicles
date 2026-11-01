// 에셋 없이 WebAudio로 효과음/배경음을 즉석 합성한다.
let ctx = null;
let master = null;
let bgmTimer = null;
let muted = false;

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.25;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur = 0.12, type = 'square', vol = 0.5, slideTo = null, delay = 0) {
  if (muted || !ensure()) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur = 0.5, vol = 0.6, lowpass = 1200) {
  if (muted || !ensure()) return;
  const n = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = ctx.createBufferSource();
  s.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = lowpass;
  const g = ctx.createGain();
  g.gain.value = vol;
  s.connect(f).connect(g).connect(master);
  s.start();
}

export const sfx = {
  unlock: () => ensure(),
  click: () => tone(660, 0.07, 'square', 0.3),
  type: () => tone(900 + Math.random() * 300, 0.03, 'square', 0.12),
  good: () => { tone(523, 0.08, 'triangle', 0.5); tone(784, 0.1, 'triangle', 0.5, null, 0.07); },
  bad: () => tone(220, 0.25, 'sawtooth', 0.5, 90),
  hit: () => { tone(300, 0.1, 'square', 0.4, 120); noise(0.12, 0.3, 2000); },
  boom: () => { noise(0.9, 0.9, 600); tone(110, 0.6, 'sawtooth', 0.6, 30); },
  glitch: () => { for (let i = 0; i < 4; i++) tone(200 + Math.random() * 1500, 0.05, 'square', 0.25, null, i * 0.04); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.6, null, i * 0.11)),
  lose: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'sawtooth', 0.45, null, i * 0.16)),
  pop: () => tone(500, 0.06, 'sine', 0.5, 1000),
  fanfare: () => [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.3, 'triangle', 0.6, null, i * 0.13)),
};

const SCALES = {
  calm: [220, 261.6, 329.6, 392, 329.6, 261.6],
  tense: [196, 233, 196, 311, 196, 277, 196, 349],
  epic: [261.6, 329.6, 392, 523.3, 392, 329.6, 440, 349.2],
};

export function bgm(mood = 'calm') {
  stopBgm();
  if (muted || !ensure()) return;
  const notes = SCALES[mood] || SCALES.calm;
  let i = 0;
  const step = mood === 'tense' ? 170 : 260;
  bgmTimer = setInterval(() => {
    tone(notes[i % notes.length], step / 1000 * 1.4, 'triangle', 0.18);
    if (i % 4 === 0) tone(notes[0] / 2, step / 1000 * 3, 'sine', 0.22);
    i++;
  }, step);
}

export function stopBgm() {
  if (bgmTimer) clearInterval(bgmTimer);
  bgmTimer = null;
}

export function toggleMute() {
  muted = !muted;
  if (muted) stopBgm();
  return muted;
}
export const isMuted = () => muted;
