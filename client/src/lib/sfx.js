// Procedural SFX; muted by default, with the existing opt-in preference.
import { readPreference, writePreference } from './preferences.js';

const MUTE_KEY = 'arena.muted';
const voices = new Set();
const ambienceStops = new Set();
let ctx = null;
let muted = readPreference(MUTE_KEY, 'on') !== 'off';

function ac() {
  if (muted) return null;
  try {
    const Audio = globalThis.window?.AudioContext || globalThis.window?.webkitAudioContext;
    if (!Audio) return null;
    if (!ctx || ctx.state === 'closed') ctx = new Audio();
    if (ctx.state === 'suspended') Promise.resolve(ctx.resume()).catch(() => {});
    return ctx;
  } catch { return null; }
}

export function isMuted() { return muted; }

export function toggleMute() {
  muted = !muted;
  writePreference(MUTE_KEY, muted ? 'on' : 'off');
  if (muted) {
    for (const stop of [...ambienceStops]) stop();
    for (const stop of [...voices]) stop();
  } else bell();
  return muted;
}

function play(cue) {
  const a = ac();
  if (a) try { cue(a); } catch { /* Audio failures must not interrupt gameplay. */ }
}

// Each source owns its gain/filter and disconnects them at its scheduled end.
function voice(a, source, duration, peak, { attack = 0.004, filter, delay = 0, loop = false, owner } = {}) {
  let gain;
  const stop = () => {
    source.onended = null;
    try { source.stop(); } catch { /* Already ended. */ }
    for (const node of [source, filter, gain]) try { node?.disconnect(); } catch { /* Unavailable device. */ }
    voices.delete(stop);
    owner?.delete(stop);
  };
  try {
    while (voices.size >= 32) voices.values().next().value();
    voices.add(stop);
    owner?.add(stop);
    gain = a.createGain();
    const t = a.currentTime + delay;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + attack);
    if (!loop) gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    source.connect(filter || gain);
    if (filter) filter.connect(gain);
    gain.connect(a.destination);
    source.onended = stop;
    source.start(t);
    if (!loop) source.stop(t + duration + 0.02);
    return stop;
  } catch (error) { stop(); throw error; }
}

function tone(a, frequency, duration, peak, options = {}) {
  const source = a.createOscillator();
  try {
    source.type = options.type || 'sine';
    source.frequency.setValueAtTime(frequency, a.currentTime + (options.delay || 0));
    if (options.end) source.frequency.exponentialRampToValueAtTime(options.end, a.currentTime + (options.delay || 0) + duration);
    return voice(a, source, duration, peak, options);
  } catch (error) { source.disconnect(); throw error; }
}

function noise(a, frequency, duration, peak, options = {}) {
  const source = a.createBufferSource();
  const filter = a.createBiquadFilter();
  try {
    const buffer = a.createBuffer(1, Math.ceil(a.sampleRate * (options.loop ? 2 : duration)), a.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    source.buffer = buffer;
    source.loop = !!options.loop;
    filter.type = options.filterType || 'lowpass';
    filter.frequency.value = frequency;
    filter.Q.value = 0.6;
    return voice(a, source, duration, peak, { ...options, filter });
  } catch (error) {
    source.disconnect(); filter.disconnect();
    throw error;
  }
}

export function bell() {
  play(a => { for (const f of [880, 884]) tone(a, f, 1.1, 0.18, { type: 'triangle' }); });
}

export function punch(heavy = false) {
  play(a => {
    noise(a, heavy ? 900 : 1600, 0.12, heavy ? 0.5 : 0.3);
    tone(a, heavy ? 120 : 160, 0.18, heavy ? 0.7 : 0.4, { end: 40, attack: 0.001 });
  });
}

export function tick() { play(a => tone(a, 1400, 0.05, 0.06, { type: 'square', attack: 0.001 })); }

export function crowd(big = false) {
  play(a => noise(a, 700, big ? 1.55 : 0.88, big ? 0.28 : 0.15, { filterType: 'bandpass', attack: big ? 0.15 : 0.08 }));
}

export function ko() {
  if (muted) return;
  punch(true);
  play(a => { for (const f of [880, 884]) tone(a, f, 1.1, 0.18, { type: 'triangle', delay: 0.12 }); });
  crowd(true);
}

const SURFACES = {
  grass: [1100, 0.065, 0.042, 105], dirt: [700, 0.06, 0.045, 95],
  stone: [2600, 0.035, 0.03, 230], sand: [1700, 0.09, 0.045, 80],
  mud: [370, 0.12, 0.065, 65], water: [2100, 0.14, 0.045, 145],
    bridge: [850, 0.055, 0.035, 180], wood: [520, 0.055, 0.032, 160],
};

export function footstep(surface = 'grass', running = false) {
  play(a => {
    const [frequency, duration, peak, thump] = SURFACES[surface] || SURFACES.grass;
    noise(a, frequency, duration, peak * (running ? 1.2 : 1));
    tone(a, thump, duration, running ? 0.042 : 0.03, { end: thump * 0.55 });
  });
}

export function discovery() {
  play(a => [523, 659, 784].forEach((f, i) => tone(a, f, 0.42, 0.045, { type: 'triangle', delay: i * 0.09 })));
}

export function travel() {
  play(a => {
    noise(a, 1200, 0.4, 0.035, { attack: 0.1 });
    tone(a, 260, 0.4, 0.04, { end: 520 });
  });
}

export function interact() {
  play(a => { tone(a, 440, 0.09, 0.04); tone(a, 660, 0.16, 0.035, { delay: 0.06 }); });
}

export function traverse(kind = 'jump') {
  play(a => {
    if (kind === 'climb') {
      noise(a, 950, 0.15, 0.045);
      tone(a, 130, 0.18, 0.035, { end: 210 });
    } else {
      const dropping = kind === 'ledge' || kind === 'drop';
      noise(a, 1500, 0.12, 0.03);
      tone(a, dropping ? 260 : 180, 0.2, 0.04, { end: dropping ? 100 : 360 });
    }
  });
}

export function land(surface = 'grass') {
  play(a => {
    const [frequency] = SURFACES[surface] || SURFACES.grass;
    noise(a, frequency, 0.16, 0.065);
    tone(a, 100, 0.18, 0.065, { end: 40 });
  });
}

export function startAdventureAmbience(biome = 'grass') {
  if (biome === 'interior') return () => {};
  const owned = new Set();
  let timer;
  let stopped = false;
  const stop = () => {
    stopped = true;
    clearTimeout(timer);
    for (const end of [...owned]) end();
    ambienceStops.delete(stop);
  };
  const a = ac();
  if (!a) return stop;
  ambienceStops.add(stop);
  const river = /river|water|marsh|coast/i.test(biome);
  try {
    noise(a, river ? 1200 : 380, 2, river ? 0.018 : 0.011, { loop: true, attack: 1.2, owner: owned });
  } catch { stop(); return stop; }
  const bird = () => {
    if (stopped || muted) return;
    play(a => {
      tone(a, 1700, 0.12, 0.006, { end: 2300, owner: owned });
      tone(a, 2100, 0.11, 0.005, { end: 1550, delay: 0.17, owner: owned });
    });
    timer = setTimeout(bird, 11000);
  };
  timer = setTimeout(bird, 7000);
  return stop;
}
