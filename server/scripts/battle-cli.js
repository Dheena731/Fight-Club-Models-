import 'dotenv/config';
import { runBattle } from '../lib/battle.js';

// Phase 2 exit check: run a full battle in the terminal.
// Usage: node server/scripts/battle-cli.js [fighterA] [fighterB] [mode] [rounds]
const [, , a = 'claude', b = 'gpt', mode = 'roast', rounds = '3'] = process.argv;

const run = async () => {
  console.log(`\n🥊  ${a} vs ${b}  —  ${mode}  (${rounds} rounds)\n`);
  const result = await runBattle({ fighterAId: a, fighterBId: b, mode, rounds: Number(rounds) });

  for (const r of result.rounds) {
    console.log(`\n=== ROUND ${r.round} ===`);
    console.log(`${result.fighters.a.name}: ${r.a.text}`);
    console.log(`${result.fighters.b.name}: ${r.b.text}`);
    console.log(`🎙  ${r.score.rationale}`);
    console.log(`   scores → ${result.fighters.a.name}: ${r.score.total.a}  |  ${result.fighters.b.name}: ${r.score.total.b}   (HP ${r.hp.a}/${r.hp.b})`);
  }

  const w = result.winnerId
    ? (result.winnerId === result.fighters.a.id ? result.fighters.a.name : result.fighters.b.name)
    : 'DRAW';
  console.log(`\n🏆  Winner: ${w}${result.ko ? '  (KO!)' : ''}\n`);
};

run().catch((e) => { console.error(e); process.exit(1); });
