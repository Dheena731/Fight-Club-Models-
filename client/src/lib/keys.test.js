import test from 'node:test';
import assert from 'node:assert/strict';
import { clearKeys, loadKeys, saveKeys } from './keys.js';

test('provider keys live only in module memory and clear on disconnect', () => {
  const removed = [];
  const previousLocal = globalThis.localStorage;
  const previousSession = globalThis.sessionStorage;
  globalThis.localStorage = { removeItem: (key) => removed.push(key) };
  globalThis.sessionStorage = { removeItem: (key) => removed.push(key) };
  try {
    saveKeys({ openai: 'secret-for-test' });
    assert.deepEqual(loadKeys(), { openai: 'secret-for-test' });
    const copy = loadKeys();
    copy.openai = 'tampered';
    assert.equal(loadKeys().openai, 'secret-for-test');
    clearKeys();
    assert.deepEqual(loadKeys(), {});
    assert.deepEqual(removed, ['aba:provider-keys', 'aba:provider-keys:session']);
  } finally {
    clearKeys();
    if (previousLocal === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousLocal;
    if (previousSession === undefined) delete globalThis.sessionStorage;
    else globalThis.sessionStorage = previousSession;
  }
});
