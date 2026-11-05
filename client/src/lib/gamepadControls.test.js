import test from 'node:test';
import assert from 'node:assert/strict';
import { installGamepadControls, readStandardGamepad } from './gamepadControls.js';

function pad(buttons = [], axes = [0, 0], index = 0) {
  return { id: `pad-${index}`, index, connected: true, mapping: 'standard', axes,
    buttons: Array.from({ length: 17 }, (_, index) => ({ pressed: buttons.includes(index) })) };
}

function harness() {
  const doc = new EventTarget();
  const target = new EventTarget();
  const frames = new Map();
  let nextFrame = 0;
  let currentPads = [];
  const events = [];
  Object.assign(doc, {
    hidden: false, activeElement: null, hasFocus: () => true,
    body: { querySelectorAll: () => [] }, dialogs: [], exploration: null, main: null, menu: null,
    querySelectorAll: () => doc.dialogs,
    querySelector: selector => ({ '.journey-game': doc.exploration, main: doc.main,
      'button[aria-label="Open Cogimon menu"]': doc.menu })[selector],
  });
  class KeyboardEvent extends Event {
    constructor(type, options) { super(type, options); this.code = options.code; this.key = options.key; }
  }
  Object.assign(target, {
    document: doc, navigator: { getGamepads: () => currentPads }, KeyboardEvent, Event,
    requestAnimationFrame: callback => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: id => frames.delete(id),
    getComputedStyle: control => ({ visibility: control.hiddenStyle ? 'hidden' : 'visible' }),
  });
  for (const type of ['keydown', 'keyup']) target.addEventListener(type, event => events.push([type, event.code]));
  function control(label, options = {}) {
    return { tagName: 'BUTTON', type: 'button', textContent: label, clicks: 0,
      getAttribute: () => null,
      getClientRects() { return this.hidden ? [] : [{}]; },
      matches() { return Boolean(this.disabled); },
      closest() { return this.inert ? {} : null; },
      focus() { doc.activeElement = this; },
      click() { this.clicks++; }, ...options };
  }
  function scope(controls = []) {
    return Object.assign(new EventTarget(), { querySelectorAll: () => controls, getAttribute: () => null, close() { doc.dialogs = doc.dialogs.filter(dialog => dialog !== this); } });
  }
  return { doc, target, events, frames, control, scope,
    pads(next) { currentPads = next; },
    event(type) { target.dispatchEvent(new Event(type)); },
    tick(now) { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(now)); },
  };
}

test('standard mapping uses physical face positions, Dpad and dominant stick axis with a drift deadzone', () => {
  assert.deepEqual(readStandardGamepad(pad([0, 1, 2, 3, 9, 15])), {
    direction: 'ArrowRight', confirm: true, back: true, run: true, traverse: true, menu: true,
  });
  assert.equal(readStandardGamepad(pad([], [0.4, -0.3])).direction, null);
  assert.equal(readStandardGamepad(pad([], [0.6, -0.9])).direction, 'ArrowUp');
  assert.equal(readStandardGamepad(pad([14], [1, 1])).direction, 'ArrowLeft');
  assert.equal(readStandardGamepad({ ...pad(), mapping: '' }), null);
  assert.equal(readStandardGamepad({ ...pad(), connected: false }), null);
  assert.equal(readStandardGamepad(null), null);
});

test('exploration emits held movement once and leaves cadence to the movement controller', () => {
  const h = harness();
  h.doc.exploration = h.scope();
  h.pads([pad()]);
  const cleanup = installGamepadControls(h.target);
  h.tick(0);
  h.pads([pad([15, 2])]); h.tick(10); h.tick(1000);
  assert.deepEqual(h.events, [['keydown', 'ArrowRight'], ['keydown', 'ShiftLeft']]);
  h.pads([pad([0, 15, 2])]); h.tick(1010); h.tick(1020);
  assert.deepEqual(h.events.slice(2), [['keydown', 'KeyE'], ['keyup', 'KeyE']]);
  h.pads([pad()]); h.tick(1030);
  assert.deepEqual(h.events.slice(-2), [['keyup', 'ArrowRight'], ['keyup', 'ShiftLeft']]);
  cleanup();
  assert.equal(h.frames.size, 0);
});

test('Start opens the existing menu, topmost dialog traps focus and held confirm never replays after a transition', () => {
  const h = harness();
  h.doc.exploration = h.scope();
  h.doc.menu = h.control('Menu');
  h.pads([pad()]);
  const cleanup = installGamepadControls(h.target); h.tick(0);
  h.pads([pad([9])]); h.tick(10); h.tick(20);
  assert.equal(h.doc.menu.clicks, 1);
  const lower = h.control('Background');
  const hidden = h.control('Hidden', { hidden: true });
  const disabled = h.control('Disabled', { disabled: true });
  const first = h.control('Continue'); const second = h.control('Other');
  const dialog = h.scope([hidden, disabled, first, second]);
  h.doc.dialogs = [h.scope([lower]), dialog];
  h.pads([pad([13])]); h.tick(30);
  assert.equal(h.doc.activeElement, first);
  h.tick(429); assert.equal(h.doc.activeElement, first);
  h.tick(430); assert.equal(h.doc.activeElement, second);
  h.tick(10000); assert.equal(h.doc.activeElement, first);
  h.tick(10001); assert.equal(h.doc.activeElement, first);
  h.pads([pad([0])]); h.tick(10010);
  assert.equal(first.clicks, 1);
  const nextButton = h.control('Do not activate twice');
  h.doc.dialogs = [h.scope([nextButton])]; h.tick(10020);
  assert.equal(nextButton.clicks, 0);
  assert.equal(lower.clicks, 0);
  assert.equal(h.events.length, 0);
  cleanup();
});

test('B sends a cancel event only to the top dialog and respects prevention', () => {
  const h = harness();
  const lower = h.scope(); const top = h.scope();
  let cancels = 0;
  top.addEventListener('cancel', event => { cancels++; event.preventDefault(); });
  h.doc.dialogs = [lower, top];
  h.pads([pad()]); const cleanup = installGamepadControls(h.target); h.tick(0);
  h.pads([pad([1])]); h.tick(10); h.tick(20);
  assert.equal(cancels, 1);
  assert.deepEqual(h.doc.dialogs, [lower, top]);
  cleanup();
});

test('title and battle controls route to focus/click, forms submit, B uses an existing Back action', () => {
  const h = harness();
  let submits = 0;
  const back = h.control('Back to title');
  const input = h.control('Name', { tagName: 'INPUT', type: 'text', form: { requestSubmit() { submits++; } } });
  h.doc.main = h.scope([back, input]);
  h.pads([pad()]); const cleanup = installGamepadControls(h.target); h.tick(0);
  h.pads([pad([12])]); h.tick(10);
  assert.equal(h.doc.activeElement, input);
  h.pads([pad([0])]); h.tick(20);
  assert.equal(submits, 1);
  h.pads([pad([1])]); h.tick(30);
  assert.equal(back.clicks, 1);
  const move = h.control('Strike');
  h.doc.main = h.scope([move]); h.doc.activeElement = null;
  h.pads([pad()]); h.tick(40);
  h.pads([pad([0])]); h.tick(50); h.tick(60);
  assert.equal(move.clicks, 1);
  assert.equal(h.events.length, 0);
  cleanup();
});

test('blur, visibility, disconnect, controller switch and cleanup release every held key', () => {
  const h = harness(); h.doc.exploration = h.scope();
  h.pads([pad([14, 2])]); const cleanup = installGamepadControls(h.target); h.tick(0);
  h.event('blur');
  assert.deepEqual(h.events.slice(-2), [['keyup', 'ArrowLeft'], ['keyup', 'ShiftLeft']]);
  assert.equal(h.frames.size, 0);
  h.event('focus'); h.tick(10);
  h.doc.hidden = true; h.doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(h.frames.size, 0);
  assert.deepEqual(h.events.slice(-2), [['keyup', 'ArrowLeft'], ['keyup', 'ShiftLeft']]);
  h.doc.hidden = false; h.doc.dispatchEvent(new Event('visibilitychange')); h.tick(20);
  h.pads([pad([15], [0, 0], 1)]); h.tick(30);
  assert.deepEqual(h.events.slice(-3), [['keyup', 'ArrowLeft'], ['keyup', 'ShiftLeft'], ['keydown', 'ArrowRight']]);
  h.pads([]); h.event('gamepaddisconnected');
  assert.deepEqual(h.events.at(-1), ['keyup', 'ArrowRight']);
  assert.equal(h.frames.size, 0);
  h.pads([pad([0])]); h.event('gamepadconnected'); h.tick(40);
  assert.equal(h.events.some(([, code]) => code === 'KeyE'), false);
  cleanup(); h.event('gamepadconnected');
  assert.equal(h.frames.size, 0);
});

test('poll-detected disconnect releases keys and no pad, nonstandard or unavailable API never schedules RAF', () => {
  assert.doesNotThrow(() => installGamepadControls(undefined)());
  const h = harness();
  h.pads([{ ...pad(), mapping: '' }]);
  const cleanup = installGamepadControls(h.target);
  assert.equal(h.frames.size, 0);
  h.doc.exploration = h.scope(); h.pads([pad([12])]); h.event('gamepadconnected'); h.tick(0);
  h.pads([]); h.tick(10);
  assert.deepEqual(h.events, [['keydown', 'ArrowUp'], ['keyup', 'ArrowUp']]);
  assert.equal(h.frames.size, 0);
  cleanup();
  delete h.target.navigator.getGamepads;
  installGamepadControls(h.target)();
  assert.equal(h.frames.size, 0);
  h.target.navigator.getGamepads = () => { throw new Error('Access denied'); };
  assert.doesNotThrow(() => installGamepadControls(h.target)());
});


test('Y traverses only on a fresh exploration press, and held face buttons survive controller/context switches without activation', () => {
  const h = harness(); h.doc.exploration = h.scope();
  h.pads([pad()]); const cleanup = installGamepadControls(h.target); h.tick(0);
  h.pads([pad([3])]); h.tick(10); h.tick(20);
  assert.deepEqual(h.events, [['keydown', 'Space'], ['keyup', 'Space']]);
  const first = h.control('Continue');
  h.doc.dialogs = [h.scope([first])]; h.tick(30);
  assert.equal(first.clicks, 0);
  h.pads([pad([0])]); h.tick(40);
  assert.equal(first.clicks, 1);
  h.pads([pad([0], [0, 0], 1)]); h.tick(50); h.tick(60);
  assert.equal(first.clicks, 1);
  const next = h.control('Confirm new screen');
  h.doc.dialogs = [h.scope([next])]; h.tick(70);
  assert.equal(next.clicks, 0);
  h.pads([pad([], [0, 0], 1)]); h.tick(80);
  h.pads([pad([0], [0, 0], 1)]); h.tick(90);
  assert.equal(next.clicks, 1);
  assert.deepEqual(h.events, [['keydown', 'Space'], ['keyup', 'Space']]);
  cleanup();
});


test('native modal focus identifies the top dialog even when its DOM order differs from opening order', () => {
  const h = harness();
  const focusedDialog = h.scope(); const laterDomDialog = h.scope();
  h.doc.dialogs = [focusedDialog, laterDomDialog];
  h.doc.activeElement = { closest: () => focusedDialog };
  h.pads([pad()]); const cleanup = installGamepadControls(h.target); h.tick(0);
  h.pads([pad([1])]); h.tick(10);
  assert.deepEqual(h.doc.dialogs, [laterDomDialog]);
  cleanup();
});


test('same exploration element reissues held movement and run after region or pause epoch changes without replaying confirm', () => {
  const h = harness();
  let epoch = 'town:journey:false';
  h.doc.exploration = h.scope();
  h.doc.exploration.getAttribute = () => epoch;
  h.pads([pad()]); const cleanup = installGamepadControls(h.target); h.tick(0);
  h.pads([pad([15, 2, 0])]); h.tick(10);
  assert.deepEqual(h.events, [['keydown', 'ArrowRight'], ['keydown', 'ShiftLeft'], ['keydown', 'KeyE'], ['keyup', 'KeyE']]);
  for (const nextEpoch of ['grove:journey:false', 'grove:journey:true', 'grove:journey:false']) {
    epoch = nextEpoch;
    h.tick(20);
    assert.deepEqual(h.events.slice(-4), [['keyup', 'ArrowRight'], ['keyup', 'ShiftLeft'], ['keydown', 'ArrowRight'], ['keydown', 'ShiftLeft']]);
    const count = h.events.length;
    h.tick(30);
    assert.equal(h.events.length, count);
  }
  assert.equal(h.events.filter(([type, code]) => type === 'keydown' && code === 'KeyE').length, 1);
  cleanup();
});
