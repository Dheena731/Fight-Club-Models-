import test from 'node:test';
import assert from 'node:assert/strict';
import { SETTLEMENT_ART, settlementFrameBounds, environmentGrid } from './adventureEnvironment.js';

test('settlement crops stay inside source and scaled runtime textures', () => {
  assert.equal(Object.keys(SETTLEMENT_ART).length, 30);
  for (const [kind, [sheet]] of Object.entries(SETTLEMENT_ART)) {
    for (const scale of [1, 0.5, 2]) {
      const width = (sheet === 'buildings' ? 1536 : 1448) * scale;
      const height = (sheet === 'buildings' ? 1024 : 1086) * scale;
      const bounds = settlementFrameBounds(kind, width, height);
      assert.equal(bounds.sheet, sheet);
      assert.ok(bounds.width > 0 && bounds.height > 0, kind);
      assert.ok(bounds.x >= 0 && bounds.y >= 0, kind);
      assert.ok(bounds.x + bounds.width <= width && bounds.y + bounds.height <= height, kind);
    }
  }
  assert.equal(settlementFrameBounds('unmapped', 1536, 1024), null);
  const silhouettes = ['inn', 'smithy', 'shop', 'townhouse', 'greenhouse', 'barn'].map(kind => JSON.stringify(SETTLEMENT_ART[kind]));
  assert.equal(new Set(silhouettes).size, 6);
});

test('interiors keep authored flooring under paths and honor terrain precedence', () => {
  const region = { width: 3, height: 2, outdoor: false, flooring: 'wood', path: [{ x: 0, y: 0, w: 3, h: 2 }], terrain: [{ x: 2, y: 1, w: 1, h: 1, kind: 'stone' }] };
  assert.deepEqual(environmentGrid(region), [['wood', 'wood', 'wood'], ['wood', 'wood', 'stone']]);
  assert.deepEqual(environmentGrid({ width: 2, height: 1, outdoor: false, flooring: 'stone' }), [['stone', 'stone']]);
  assert.deepEqual(environmentGrid({ width: 2, height: 1 }), [['grass', 'grass']]);
});
