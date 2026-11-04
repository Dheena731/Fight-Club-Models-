# Cogimon

An AI creature companion adventure in a browser, with warm GBA-style pixel visuals, a playable first chapter, **The Lantern Signal**, and an optional live AI model arena. The adventure is original fiction; its character stats are game flavor, not measured model performance. [Development blueprint](docs/ai-frontier/README.md).

The GBA companion redesign is being implemented against the [complete progression plan](docs/ai-frontier/PROGRESSION_PLAN.md), with checkpoint evidence in the [work log](docs/ai-frontier/WORK_LOG.md).

## Playable modes

- **Journey:** name your trainer, inspect three original starter companions, cross an authored town/forest/Archive, recruit Mossback, restore a relay and defeat the Archive Warden. Keyboard and touch movement are supported; versioned progress saves locally with legacy-save import.
- **Practice:** repeatable, deterministic creature combat without changing Journey XP or unlocks.
- **Rival Circuit:** three local rival encounters with recovery and a separate local record. No provider key required.
- **Locker:** equip earned Lantern cosmetics, a title and up to three badges; preview the arena entrance without making a model call. These rewards remain local/unverified.
- **Live model arena:** enter from Frontier Crossing to play Roast, Prompt-Injection, or Impersonation matches using your own provider credentials. This is separate from RPG combat and may incur provider charges.

The first chapter is a bounded playable slice, not a finished open-world game. A lore codex separates sourced AI history from invented game abilities. Multiplayer, more chapters, deeper RPG combat, and a fully reviewed BYOK challenge system remain planned. See the [roadmap](docs/ai-frontier/ROADMAP.md).

PixiJS renders exploration and the arena; React owns readable HUD, dialogue, controls, and menus.

Cogimon is the product brand. The repository name `Fight-Club-Models-`, `docs/ai-frontier` paths and legacy browser keys remain stable: `ai-frontier:adventure:v3`, `ai-frontier:circuit:v1`, `ai-frontier:profile:v1`, `ai-frontier:save:v2`, `ai-frontier:save:v1` and `aba:theme`. The rebrand preserves existing progress and preferences; obsolete `aba:provider-keys` entries still receive the documented credential cleanup.

## Stack

- Client: React, Vite, Tailwind, Framer Motion, PixiJS 8
- Server: Node.js and Express with SSE battle streaming
- Providers: Anthropic, OpenAI, Google Gemini, and registry-backed OpenAI-compatible providers
- Tests: Node's built-in test runner, with a browser walkthrough of the chapter

## Setup

```bash
cp .env.example .env
npm run install:all
npm run dev
```

Open `http://localhost:5173`. The API runs on `http://localhost:8787`.

Useful checks:

```bash
npm test
npm --prefix client run lint
npm --prefix client run build
```

## API

A fighter is either a built-in spec such as `{ "id": "claude", "apiKey": "..." }`, or a custom registry provider spec such as `{ "provider": "openrouter", "model": "...", "apiKey": "..." }`.

- `GET /api/health` - liveness
- `GET /api/battle/meta` - roster, modes, and providers
- `POST /api/model/health-check` - preflight the exact fighter spec
- `POST /api/battle` - return a complete match
- `POST /api/battle/stream` - stream `turn:a`, `turn:b`, `verdict`, and `end` events

Battle requests accept `fighterAId`, `fighterBId`, `mode`, `rounds`, `topic`, and a `cards` array.

## Keys, cost, and security

- Keys live in browser memory only; refresh or return to the world disconnects them. Previous local/session key copies are removed on boot. Never put a real key in screenshots or bug reports.
- Requests pass through the Express battle proxy. New provider calls stop when a client disconnects, but an in-flight call may still be billable.
- Built-in providers ignore client endpoint overrides.
- Arbitrary custom model URLs are disabled by default. If explicitly enabled for a controlled deployment, only HTTPS public endpoints are accepted unless private URLs are separately enabled.
- Model output is sanitized before being fed to the next fighter.
- Scores come from two anonymized fighter-judges; one provider may fail, but two failures stop the match instead of fabricating a draw.
- A three-round match uses up to 12 battle model calls, plus one preflight call for each selected provider. The arena has not completed the full Phase 4 security/cost review.

See [GAME_DESIGN.md](GAME_DESIGN.md), [DESIGN.md](DESIGN.md), and [MARKETING.md](MARKETING.md) for the product direction.
