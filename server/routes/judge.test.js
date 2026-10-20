import test from 'node:test';
import assert from 'node:assert/strict';
import { judgeRound, parseJudgeText } from './judge.js';

const fighters = {
  a: { id: 'red-model', apiKey: 'red-key' },
  b: { id: 'blue-model', apiKey: 'blue-key' },
};

const decision = (a, b, rationale) => ({
  text: JSON.stringify({
    a: { wit: a, creativity: a, burns: a },
    b: { wit: b, creativity: b, burns: b },
    rationale,
  }),
});

test('judgeRound averages two anonymized fighter decisions', async () => {
  const score = await judgeRound({
    ...fighters,
    mode: 'roast',
    turnA: 'red line',
    turnB: 'blue line',
    judgeCall: async (fighter) => fighter.id === 'red-model'
      ? decision(8, 4, 'Red lands cleanly.')
      : decision(6, 8, 'Blue counters well.'),
  });

  assert.deepEqual(score.a, { wit: 7, creativity: 7, burns: 7 });
  assert.deepEqual(score.b, { wit: 6, creativity: 6, burns: 6 });
  assert.deepEqual(score.total, { a: 21, b: 18 });
  assert.equal(score.judges, 2);
  assert.match(score.rationale, /Split decision/);
});

test('judgeRound continues when one judge provider fails', async () => {
  const score = await judgeRound({
    ...fighters,
    mode: 'roast',
    turnA: 'red line',
    turnB: 'blue line',
    judgeCall: async (fighter) => {
      if (fighter.id === 'red-model') throw new Error('provider unavailable');
      return decision(5, 9, 'Blue wins.');
    },
  });

  assert.equal(score.judges, 1);
  assert.deepEqual(score.total, { a: 15, b: 27 });
});

test('judgeRound rejects instead of silently returning a draw when both judges fail', async () => {
  await assert.rejects(
    judgeRound({
      ...fighters,
      mode: 'roast',
      turnA: 'red line',
      turnB: 'blue line',
      judgeCall: async () => { throw new Error('provider unavailable'); },
    }),
    /Judges unavailable/,
  );
});

test('parseJudgeText extracts JSON and clamps invalid scores', () => {
  const parsed = parseJudgeText('commentary before {"a":{"wit":99,"creativity":0,"burns":"7"},"b":{},"rationale":"ok"} after');
  assert.deepEqual(parsed.a, { wit: 10, creativity: 1, burns: 7 });
  assert.deepEqual(parsed.b, { wit: 5, creativity: 5, burns: 5 });
});
