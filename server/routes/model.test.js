import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveHealthCheckFighter } from './model.js';

test('health check accepts the same built-in fighter spec as battle', () => {
  const fighter = resolveHealthCheckFighter({ id: 'claude', apiKey: 'secret' });
  assert.equal(fighter.id, 'claude');
  assert.equal(fighter.provider, 'anthropic');
  assert.equal(fighter.apiKey, 'secret');
});

test('known providers ignore a client-supplied endpoint override', () => {
  const fighter = resolveHealthCheckFighter({
    provider: 'openai',
    model: 'gpt-4o',
    apiKey: 'secret',
    baseURL: 'https://attacker.example/v1',
  });
  assert.notEqual(fighter.baseURL, 'https://attacker.example/v1');
});

test('arbitrary custom providers are disabled by default', () => {
  assert.throws(
    () => resolveHealthCheckFighter({
      provider: 'custom',
      model: 'local-model',
      apiKey: 'secret',
      baseURL: 'http://127.0.0.1:11434/v1',
    }),
    /disabled/,
  );
});
