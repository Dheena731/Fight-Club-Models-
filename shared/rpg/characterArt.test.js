import test from 'node:test';
import assert from 'node:assert/strict';
import { PROVIDERS } from '../providers.js';
import { HEROES } from './world.js';
import { CREATURES, FIGHTER_CREATURE, HERO_CREATURE, PROVIDER_CREATURE, getCreature } from '../../client/src/components/creatures/pixelData.js';

test('every provider and playable hero has a distinct original pixel identity', () => {
  assert.deepEqual(Object.keys(PROVIDER_CREATURE).sort(), Object.keys(PROVIDERS).sort());
  assert.equal(new Set(Object.values(PROVIDER_CREATURE)).size, Object.keys(PROVIDERS).length);
  assert.equal(new Set(HEROES.map((hero) => HERO_CREATURE[hero.id])).size, HEROES.length);
  for (const [provider, creatureId] of Object.entries(PROVIDER_CREATURE)) {
    assert.strictEqual(getCreature(provider), CREATURES[creatureId]);
    assert.ok(CREATURES[creatureId].name && CREATURES[creatureId].persona);
  }
  for (const [fighter, creatureId] of Object.entries(FIGHTER_CREATURE)) {
    assert.strictEqual(getCreature(fighter), CREATURES[creatureId]);
  }
  for (const hero of HEROES) assert.strictEqual(getCreature(hero.id), CREATURES[HERO_CREATURE[hero.id]]);
});

test('sprite grids are rectangular, colored, and silhouette-distinct', () => {
  const silhouettes = new Set();
  for (const creature of Object.values(CREATURES)) {
    assert.equal(creature.px.length, 20, creature.name);
    assert.equal(Object.keys(creature.pal).length, 5, creature.name);
    for (const row of creature.px) {
      assert.equal(row.length, 18, creature.name);
      for (const pixel of row) assert.ok(pixel === '_' || creature.pal[pixel], `${creature.name}: ${pixel}`);
    }
    const silhouette = creature.px.map((row) => row.replace(/[^_]/g, '#')).join('');
    assert.ok(silhouette.includes('#'));
    assert.ok(!silhouettes.has(silhouette), `${creature.name} repeats another silhouette`);
    silhouettes.add(silhouette);
  }
});
