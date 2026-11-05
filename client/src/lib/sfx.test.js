import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers';

let version = 0;
async function load(t, preference = 'off', Audio) {
  const previousWindow = globalThis.window;
  const previousStorage = globalThis.localStorage;
  const contexts = [];
  const values = new Map(preference ? [['arena.muted', preference]] : []);
  const param = () => ({
    value: 0, changes: [],
    setValueAtTime(value, time) { this.changes.push(['set', value, time]); },
    linearRampToValueAtTime(value, time) { this.changes.push(['linear', value, time]); },
    exponentialRampToValueAtTime(value, time) { this.changes.push(['exponential', value, time]); },
  });
  class MockAudio {
    constructor() { this.nodes = []; this.state = 'running'; this.currentTime = 1; this.sampleRate = 100; this.destination = {}; contexts.push(this); }
    node(kind) {
      const node = {
        kind, gain: param(), frequency: param(), Q: param(),
        connect(to) { this.to = to; },
        disconnect() { this.disconnected = true; },
        start(time) { this.started = time; },
        stop(time) { this.stopped = time ?? 0; },
      };
      this.nodes.push(node);
      return node;
    }
    createOscillator() { return this.node('oscillator'); }
    createBufferSource() { return this.node('buffer'); }
    createGain() { return this.node('gain'); }
    createBiquadFilter() { return this.node('filter'); }
    createBuffer(_channels, length) { return { getChannelData: () => new Float32Array(length) }; }
    resume() { return Promise.resolve(); }
  }
  globalThis.window = Audio === null ? {} : { AudioContext: Audio || MockAudio };
  globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
    if (previousStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = previousStorage;
  });
  const sfx = await import(`./sfx.js?test=${++version}`);
  return { sfx, contexts, values, MockAudio };
}

function cues(sfx) {
  sfx.bell(); sfx.punch(); sfx.tick(); sfx.crowd(); sfx.ko();
  sfx.footstep(); sfx.discovery(); sfx.travel(); sfx.interact(); sfx.traverse(); sfx.land();
}

test('default mute creates no audio and persists opt-in using the existing preference', async t => {
  const { sfx, contexts, values } = await load(t, null);
  assert.equal(sfx.isMuted(), true);
  cues(sfx);
  sfx.startAdventureAmbience()();
  assert.equal(contexts.length, 0);
  assert.equal(sfx.toggleMute(), false);
  assert.equal(values.get('arena.muted'), 'off');
  assert.equal(contexts.length, 1);
  assert.equal(sfx.toggleMute(), true);
  assert.equal(values.get('arena.muted'), 'on');
  assert.ok(contexts[0].nodes.every(node => node.disconnected));
});

test('missing or failing audio devices never interrupt any cue or ambience', async t => {
  for (const Audio of [null, class { constructor() { throw new Error('device unavailable'); } }]) {
    const { sfx } = await load(t, 'off', Audio);
    assert.doesNotThrow(() => { cues(sfx); sfx.startAdventureAmbience()(); });
  }
});

test('resume promise rejection is handled and node creation failures stay isolated', async t => {
  const { sfx, contexts, MockAudio } = await load(t);
  t.mock.method(MockAudio.prototype, 'resume', () => Promise.reject(new Error('gesture required')));
  sfx.tick();
  contexts[0].state = 'suspended';
  sfx.tick();
  await new Promise(resolve => setImmediate(resolve));
  t.mock.method(contexts[0], 'createGain', () => { throw new Error('device lost'); });
  assert.doesNotThrow(() => { cues(sfx); sfx.startAdventureAmbience()(); });
  sfx.toggleMute();
  assert.ok(contexts[0].nodes.every(node => node.disconnected));
});

test('terrain footsteps differ, running increases impact, and adventure cues stay quiet', async t => {
  const { sfx, contexts } = await load(t);
  const frequencies = [];
  for (const surface of ['grass', 'dirt', 'stone', 'sand', 'mud', 'water', 'bridge', 'wood']) {
    sfx.footstep(surface);
    frequencies.push(contexts[0].nodes.filter(node => node.kind === 'filter').at(-1).frequency.value);
  }
  assert.equal(new Set(frequencies).size, 8);
  sfx.footstep('grass', true);
  const gains = contexts[0].nodes.filter(node => node.kind === 'gain');
  assert.ok(gains.at(-2).gain.changes[1][1] > gains[0].gain.changes[1][1]);
  sfx.discovery(); sfx.travel(); sfx.interact(); sfx.traverse('jump'); sfx.traverse('climb'); sfx.traverse('drop'); sfx.land('stone');
  for (const node of contexts[0].nodes.filter(node => node.kind === 'gain')) assert.ok(node.gain.changes[1][1] <= 0.08);
  sfx.toggleMute();
});

test('every one-shot is scheduled to end and disconnects all owned nodes', async t => {
  const { sfx, contexts } = await load(t);
  cues(sfx);
  const nodes = contexts[0].nodes;
  for (const source of nodes.filter(node => ['oscillator', 'buffer'].includes(node.kind))) {
    assert.ok(source.disconnected || (Number.isFinite(source.stopped) && source.stopped > source.started));
    source.onended?.();
  }
  assert.ok(nodes.every(node => node.disconnected));
});

test('canonical ledge traversal shares the descending drop cue', async t => {
  const { sfx, contexts } = await load(t);
  const pitches = [];
  for (const kind of ['jump', 'ledge', 'drop']) {
    sfx.traverse(kind);
    pitches.push(contexts[0].nodes.filter(node => node.kind === 'oscillator').at(-1).frequency.changes.map(change => change[1]));
  }
  assert.deepEqual(pitches, [[180, 360], [260, 100], [260, 100]]);
  sfx.toggleMute();
});

test('rapid input bounds active voices and mute stops sustained ambience immediately', async t => {
  const { sfx, contexts } = await load(t);
  for (let i = 0; i < 100; i++) sfx.footstep('mud', true);
  const liveSources = () => contexts[0].nodes.filter(node => ['oscillator', 'buffer'].includes(node.kind) && !node.disconnected);
  assert.equal(liveSources().length, 32);
  const timers = [];
  const cleared = [];
  t.mock.method(globalThis, 'setTimeout', (fn, ms) => { const timer = { fn, ms }; timers.push(timer); return timer; });
  t.mock.method(globalThis, 'clearTimeout', timer => cleared.push(timer));
  const stop = sfx.startAdventureAmbience('river');
  const wind = liveSources().find(node => node.loop);
  assert.ok(wind);
  assert.equal(wind.to.frequency.value, 1200);
  timers[0].fn();
  assert.equal(timers.length, 2);
  stop(); stop();
  assert.equal(wind.disconnected, true);
  assert.ok(cleared.includes(timers[1]));
  const second = sfx.startAdventureAmbience('grass');
  sfx.toggleMute();
  assert.equal(liveSources().length, 0);
  second();
  const count = contexts[0].nodes.length;
  for (const timer of timers) timer.fn();
  assert.equal(contexts[0].nodes.length, count);
});
