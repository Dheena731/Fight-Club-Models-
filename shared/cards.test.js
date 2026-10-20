import test from 'node:test';
import assert from 'node:assert/strict';
import { getPromptCard, normalizeCardSequence, publicPromptCard } from './cards.js';
import { buildPrompt } from './prompts.js';

test('card sequences default unplanned rounds to Jab', () => {
  const cards = normalizeCardSequence(['callback'], 3);
  assert.deepEqual(cards.map((card) => card.id), ['callback', 'jab', 'jab']);
});

test('unknown cards are rejected', () => {
  assert.throws(() => getPromptCard('instant-win'), /Unknown prompt card/);
});

test('public cards never expose hidden prompt directives', () => {
  const card = publicPromptCard(getPromptCard('glass-cannon'));
  assert.equal(card.id, 'glass-cannon');
  assert.equal(card.damageMultiplier, 1.6);
  assert.equal('directive' in card, false);
});

test('a chosen card changes only the coached fighter prompt', () => {
  const prompt = buildPrompt('roast', {
    self: { name: 'Red', style: 'sharp' },
    opponent: { name: 'Blue', style: 'dry' },
    round: 1,
    card: getPromptCard('jab'),
  });
  assert.match(prompt, /cornerman played Jab/);
  assert.match(prompt, /exactly one sentence/);
});
