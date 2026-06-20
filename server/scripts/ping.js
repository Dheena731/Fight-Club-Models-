import 'dotenv/config';
import { callModel } from '../adapters/index.js';
import { FIGHTERS } from '../../shared/fighters.js';

// Phase 1 exit check: pings each provider and prints the unified shape.
const SYSTEM = 'You are a fighter warming up. Reply with one short, cocky one-liner.';
const USER = 'Say something to hype the crowd before the fight.';

const run = async () => {
  for (const f of Object.values(FIGHTERS)) {
    process.stdout.write(`\n— ${f.name} (${f.provider}/${f.modelId}) —\n`);
    try {
      const res = await callModel(f.id, SYSTEM, USER, { maxTokens: 60 });
      console.log(res);
    } catch (e) {
      console.error(`  ✖ ${e.message}`);
    }
  }
};

run();
