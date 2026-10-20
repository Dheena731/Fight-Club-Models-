import test from 'node:test';
import assert from 'node:assert/strict';
import { applyDamage, runBattle } from './battle.js';

test('Glass Cannon amplifies server-authoritative damage', () => {
  const hp = { a: 100, b: 100 };
  const damage = applyDamage(hp, { a: 20, b: 10 }, { damageMultiplier: 1.6 });
  assert.equal(damage, 45);
  assert.deepEqual(hp, { a: 100, b: 55 });
});

test('damage is capped and ties do not reduce HP', () => {
  const hp = { a: 100, b: 100 };
  assert.equal(applyDamage(hp, { a: 15, b: 15 }), 0);
  assert.deepEqual(hp, { a: 100, b: 100 });

  const capped = applyDamage(hp, { a: 30, b: 1 }, { damageMultiplier: 10 });
  assert.equal(capped, 60);
  assert.equal(hp.b, 40);
});

test('disconnect after the first turn prevents later paid model calls', async () => {
  const controller = new AbortController();
  let calls = 0;
  await assert.rejects(runBattle({
    fighterAId: { id: 'claude', apiKey: 'test-a' },
    fighterBId: { id: 'gpt', apiKey: 'test-b' },
    mode: 'roast', rounds: 3,
    signal: controller.signal,
    modelCall: async () => {
      calls += 1;
      return { text: 'A test reply', latencyMs: 1, tokensUsed: 1 };
    },
    scoreRound: async () => { throw new Error('Judge should not run after disconnect'); },
    onEvent: (event) => { if (event === 'turn:a') controller.abort(); },
  }), { name: 'AbortError' });
  assert.equal(calls, 1);
});
