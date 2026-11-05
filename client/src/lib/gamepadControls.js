const CONTROL_SELECTOR = 'button, input:not([type="hidden"]), select, textarea, a[href]';

export function readStandardGamepad(pad) {
  // shortcut: only browser-standard mappings are supported; add explicit mappings if other pads are needed.
  if (!pad || pad.connected === false || pad.mapping !== 'standard') return null;
  const pressed = (index) => Boolean(pad.buttons[index]?.pressed);
  const dpad = [12, 13, 14, 15].some(pressed);
  const x = dpad ? Number(pressed(15)) - Number(pressed(14)) : pad.axes[0] || 0;
  const y = dpad ? Number(pressed(13)) - Number(pressed(12)) : pad.axes[1] || 0;
  let direction = null;
  if (Math.max(Math.abs(x), Math.abs(y)) > 0.5) {
    direction = Math.abs(x) > Math.abs(y) ? (x > 0 ? 'ArrowRight' : 'ArrowLeft') : (y > 0 ? 'ArrowDown' : 'ArrowUp');
  }
  return { direction, confirm: pressed(0), back: pressed(1), run: pressed(2), traverse: pressed(3), menu: pressed(9) };
}

export function installGamepadControls(target = globalThis.window) {
  if (!target?.navigator?.getGamepads) return () => {};
  const doc = target.document;
  let frame = null;
  let focused = doc.hasFocus();
  let identity = null;
  let previous = null;
  let context = null;
  let contextEpoch = null;
  let direction = null;
  let repeatAt = 0;
  const keys = new Set();

  const pads = () => {
    try { return Array.from(target.navigator.getGamepads()).filter(pad => readStandardGamepad(pad)); }
    catch { return []; }
  };
  const keyboard = (type, code) => target.dispatchEvent(new target.KeyboardEvent(type, {
    code, key: code === 'ShiftLeft' ? 'Shift' : code === 'KeyE' ? 'e' : code, bubbles: true, cancelable: true,
  }));
  const release = () => {
    for (const code of keys) keyboard('keyup', code);
    keys.clear();
  };
  const reset = () => {
    release();
    previous = null;
    context = null;
    contextEpoch = null;
    direction = null;
    repeatAt = 0;
    identity = null;
  };
  const stop = () => {
    if (frame !== null) target.cancelAnimationFrame(frame);
    frame = null;
    reset();
  };
  const controls = (scope) => Array.from(scope.querySelectorAll(CONTROL_SELECTOR)).filter(control => (
    !control.matches(':disabled, [aria-disabled="true"]')
    && !control.closest('[inert], [aria-hidden="true"]')
    && control.getClientRects().length > 0
    && target.getComputedStyle(control).visibility !== 'hidden'
  ));
  const focusNext = (scope, arrow) => {
    const options = controls(scope);
    if (!options.length) return;
    const index = options.indexOf(doc.activeElement);
    const step = ['ArrowUp', 'ArrowLeft'].includes(arrow) ? -1 : 1;
    options[index < 0 ? (step > 0 ? 0 : options.length - 1) : (index + step + options.length) % options.length].focus();
  };
  const confirm = (scope) => {
    const options = controls(scope);
    const control = options.includes(doc.activeElement) ? doc.activeElement : options[0];
    if (!control) return;
    control.focus();
    if (['INPUT', 'TEXTAREA'].includes(control.tagName) && control.form
      && !['button', 'submit', 'reset', 'checkbox', 'radio'].includes(control.type)) control.form.requestSubmit();
    else control.click();
  };
  const back = (dialog, scope) => {
    if (dialog) {
      const event = new target.Event('cancel', { cancelable: true });
      if (dialog.dispatchEvent(event)) dialog.close();
    } else controls(scope).find(control => /^(back|return|cancel)\b/i.test(control.getAttribute('aria-label') || control.textContent.trim()))?.click();
  };
  function poll(now) {
    frame = null;
    const available = pads();
    const pad = available.find(pad => `${pad.index}:${pad.id}` === identity) || available[0];
    if (!pad || doc.hidden || !focused) { reset(); return; }
    const input = readStandardGamepad(pad);
    const nextIdentity = `${pad.index}:${pad.id}`;
    if (nextIdentity !== identity) { reset(); identity = nextIdentity; }
    const dialogs = doc.querySelectorAll('dialog[open]');
    const dialog = doc.activeElement?.closest?.('dialog[open]') || dialogs[dialogs.length - 1];
    const exploration = !dialog && doc.querySelector('.journey-game');
    const scope = dialog || exploration || doc.querySelector('main') || doc.body;
    const epoch = exploration ? exploration.getAttribute('data-gamepad-context') : null;
    if (context !== scope || contextEpoch !== epoch) {
      release();
      context = scope;
      contextEpoch = epoch;
      direction = null;
      repeatAt = 0;
    }
    const last = previous || input;
    previous = input;
    if (exploration) {
      const nextKeys = new Set([input.direction, input.run && 'ShiftLeft'].filter(Boolean));
      for (const code of keys) if (!nextKeys.has(code)) { keyboard('keyup', code); keys.delete(code); }
      for (const code of nextKeys) if (!keys.has(code)) { keyboard('keydown', code); keys.add(code); }
    } else {
      release();
      if (input.direction && (input.direction !== direction || now >= repeatAt)) {
        focusNext(scope, input.direction);
        repeatAt = now + (input.direction === direction ? 140 : 400);
      }
    }
    direction = input.direction;
    if (input.back && !last.back) back(dialog, scope);
    else if (input.menu && !last.menu && exploration) doc.querySelector('button[aria-label="Open Cogimon menu"]')?.click();
    else if (input.confirm && !last.confirm) {
      if (exploration) { keyboard('keydown', 'KeyE'); keyboard('keyup', 'KeyE'); }
      else confirm(scope);
    } else if (input.traverse && !last.traverse && exploration) {
      keyboard('keydown', 'Space'); keyboard('keyup', 'Space');
    }
    frame = target.requestAnimationFrame(poll);
  }
  function wake() {
    if (frame === null && focused && !doc.hidden && pads().length) frame = target.requestAnimationFrame(poll);
  }
  const onBlur = () => { focused = false; stop(); };
  const onFocus = () => { focused = true; wake(); };
  const onVisibility = () => { if (doc.hidden) stop(); else wake(); };
  const onDisconnect = () => { stop(); wake(); };
  target.addEventListener('gamepadconnected', wake);
  target.addEventListener('gamepaddisconnected', onDisconnect);
  target.addEventListener('blur', onBlur);
  target.addEventListener('focus', onFocus);
  doc.addEventListener('visibilitychange', onVisibility);
  wake();
  return () => {
    stop();
    target.removeEventListener('gamepadconnected', wake);
    target.removeEventListener('gamepaddisconnected', onDisconnect);
    target.removeEventListener('blur', onBlur);
    target.removeEventListener('focus', onFocus);
    doc.removeEventListener('visibilitychange', onVisibility);
  };
}
