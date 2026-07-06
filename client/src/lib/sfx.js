// Procedural SFX — WebAudio synth, zero assets to load.
// Muted by default; user opt-in persists in localStorage.

const MUTE_KEY = 'arena.muted';
let ctx = null;
let muted = localStorage.getItem(MUTE_KEY) !== 'off'; // default muted

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  localStorage.setItem(MUTE_KEY, muted ? 'on' : 'off');
  if (!muted) bell(); // audible confirmation
  return muted;
}

function env(node, t0, attack, decay, peak = 1) {
  const g = ac().createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
  node.connect(g);
  g.connect(ac().destination);
  return g;
}

function noiseBuffer(seconds) {
  const a = ac();
  const buf = a.createBuffer(1, a.sampleRate * seconds, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

/** Ring bell — two detuned triangles. */
export function bell() {
  if (muted) return;
  const a = ac();
  const t = a.currentTime;
  [880, 884].forEach((f) => {
    const o = a.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f;
    env(o, t, 0.005, 1.1, 0.18);
    o.start(t);
    o.stop(t + 1.2);
  });
}

/** Punch — noise burst + sub thump. Heavier hits get more sub. */
export function punch(heavy = false) {
  if (muted) return;
  const a = ac();
  const t = a.currentTime;
  const src = a.createBufferSource();
  src.buffer = noiseBuffer(0.12);
  const filter = a.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = heavy ? 900 : 1600;
  src.connect(filter);
  env(filter, t, 0.001, 0.12, heavy ? 0.5 : 0.3);
  src.start(t);

  const o = a.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(heavy ? 120 : 160, t);
  o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
  env(o, t, 0.001, 0.18, heavy ? 0.7 : 0.4);
  o.start(t);
  o.stop(t + 0.25);
}

/** UI tick. */
export function tick() {
  if (muted) return;
  const a = ac();
  const t = a.currentTime;
  const o = a.createOscillator();
  o.type = 'square';
  o.frequency.value = 1400;
  env(o, t, 0.001, 0.05, 0.06);
  o.start(t);
  o.stop(t + 0.08);
}

/** Crowd swell — filtered noise. */
export function crowd(big = false) {
  if (muted) return;
  const a = ac();
  const t = a.currentTime;
  const src = a.createBufferSource();
  src.buffer = noiseBuffer(big ? 1.6 : 0.9);
  const filter = a.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 700;
  filter.Q.value = 0.6;
  src.connect(filter);
  env(filter, t, big ? 0.15 : 0.08, big ? 1.4 : 0.8, big ? 0.28 : 0.15);
  src.start(t);
}

/** KO — heavy thump + long bell + crowd eruption. */
export function ko() {
  if (muted) return;
  punch(true);
  setTimeout(() => bell(), 120);
  crowd(true);
}
