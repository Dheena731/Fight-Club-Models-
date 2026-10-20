import test from 'node:test';
import assert from 'node:assert/strict';
import { FIGHTERS } from '../fighters.js';

test('built-in fighters disclose source-linked model lifecycle without confusing it with game stats', () => {
  assert.equal(FIGHTERS.gpt.modelStatus, 'deprecated');
  for (const fighter of Object.values(FIGHTERS)) {
    assert.ok(['stable', 'legacy', 'deprecated'].includes(fighter.modelStatus));
    assert.match(fighter.modelSourceUrl, /^https:\/\//);
    assert.ok(!('power' in fighter) && !('speed' in fighter) && !('wit' in fighter));
  }
});
