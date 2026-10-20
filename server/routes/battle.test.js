import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBattleRequest } from './battle.js';

const base = {
  fighterAId: { id: 'claude', apiKey: 'a' },
  fighterBId: { id: 'gpt', apiKey: 'b' },
  mode: 'roast',
  rounds: 3,
};

test('battle validation accepts known prompt cards', () => {
  assert.equal(validateBattleRequest({ ...base, cards: ['jab', 'callback', 'glass-cannon'] }), null);
});

test('battle validation rejects unknown cards and invalid round counts', () => {
  assert.match(validateBattleRequest({ ...base, cards: ['instant-win'] }), /Unknown prompt card/);
  assert.match(validateBattleRequest({ ...base, rounds: -2 }), /rounds/i);
});
