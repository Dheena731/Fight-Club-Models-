import test from 'node:test';
import assert from 'node:assert/strict';
import { FACTIONS } from './factions.js';
import { HISTORICAL_RECORDS } from './lore.js';

test('each faction inspiration has a distinct primary-source record and separate fiction', () => {
  const ids = new Set(HISTORICAL_RECORDS.map((record) => record.id));
  assert.equal(ids.size, HISTORICAL_RECORDS.length);
  for (const faction of Object.values(FACTIONS)) assert.ok(ids.has(faction.sourceId));
  for (const record of HISTORICAL_RECORDS) {
    assert.match(record.sourceUrl, /^https:\/\//);
    assert.ok(record.fact.length > 40);
    assert.ok(record.fiction.length > 40);
    assert.ok(!record.fact.includes(record.fiction));
  }
});
