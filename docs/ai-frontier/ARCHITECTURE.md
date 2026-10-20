# Architecture and file structure

## Phase 0 audit: what actually exists

The repository is an npm workspace by convention, not a monorepo framework. The root Express server exposes model metadata, preflight, synchronous battles, and SSE battle streaming. The Vite/React client now routes `BOOT → TITLE → WORLD → SELECT → VS → FIGHT → RESULT`, with returns from arena to world or title. PixiJS 8 renders the world and arena; React renders menus, text, HUD, and results. Shared JavaScript defines world data/rules, fighters, providers, prompts, and cards. RPG progress saves locally; arena credentials live in browser memory. There is no database, authentication, authoritative multiplayer state, or networking.

Baseline before the RPG slice on 2026-10-18: `npm test` passed 19/19; `npm --prefix client run build` passed, with a Pixi bundle-size warning. New RPG tests cover chapter reachability, quest/combat rules, and save validation. The working tree already contained substantial uncommitted arena work; preserve it.

| Existing file/area | Keep or evolve | First integration point |
| --- | --- | --- |
| `client/src/App.jsx`, `game/gameReducer.js` | Extend phases; do not replace reducer wholesale | Title, world, and return-from-arena routing |
| `client/src/stage/*` | Keep as arena renderer; isolate lifecycle from world canvas | World uses its own Pixi scene initially; load arena stage on entry |
| `client/src/screens/Home.jsx`, `Battle.jsx`, `Result.jsx` | Preserve live arena; rename in navigation/copy gradually | Arena entrance and exit to world |
| `client/src/components/creatures/pixelData.js` | Reuse original pixel assets; add art rules | Faction and character prototypes |
| `client/src/lib/keys.js`, `CoinSlot.jsx` | Refactor credential lifecycle | Remove persistent key storage before public RPG release |
| `server/lib/battle.js`, `routes/battle.js`, `adapters/*` | Preserve real provider calls; harden before competition | Versioned challenges, cancellation, bounded costs |
| `shared/fighters.js`, `providers.js` | Keep provider registry separate from fictional stats | Character metadata references provider/model ids |
| `shared/cards.js`, `prompts.js` | Keep in live arena namespace | Do not reuse prompt cards as offline RPG abilities |

## Implemented structure and future growth

```text
client/src/
  App.jsx                  # phase routing and lazy arena readiness
  game/                    # shared app reducer, arena credential handoff
  rpg/
    Title.jsx              # new/continue and hero choice
    World.jsx              # world HUD, dialogue, journal, map, touch controls
    WorldScene.jsx         # Pixi tile/object/hero rendering and camera
    frontier.css           # pixel UI tokens and responsive layout
  screens/                 # preserved arena select, VS, battle, result
  stage/                   # arena-only Pixi rendering and lifecycle
  lib/                     # API transport, audio, in-memory credentials
shared/
  rpg/
    world.js               # current regions, quest, hero and combat definitions
    worldState.js          # pure rules, collision, persistence, save validation
    worldState.test.js     # reachability, quest/combat/save tests
  providers.js             # existing provider registry
server/
  adapters/                # existing supported provider adapters
  routes/                  # existing arena routes; later challenge/room APIs
  lib/                     # existing battle engine; later validated scoring/rooms
docs/ai-frontier/           # current blueprint and decision log
```

Create additional `rpg/input`, `rpg/render`, `shared/rpg/quests`, `shared/rpg/lore`, `shared/challenges`, or `server/realtime` modules only when their systems are implemented. Do not move existing arena files merely to match a proposed tree. Keep content definitions free of React, Pixi, and provider SDK imports. World rendering reads state; it never awards rewards or chooses quest outcomes.

## Runtime boundaries

- **World simulation:** pure reducer receives `MOVE`, `INTERACT`, `CHOOSE`, `USE_ITEM`, `COMBAT_ACTION`, and `TRAVEL`. It validates distance, collision, prerequisites, inventory, and rewards. It returns next state plus explicit events for animation/audio. Use delta time for camera/animation; do not make frame rate control movement speed.
- **Renderer:** Pixi owns tiles, characters, effects, and camera. World UI stays in DOM at native CSS size. Avoid scaling dialogue and tap targets with the game canvas. Initialize/destroy Pixi with scene lifecycle; cache textures and pause the ticker when hidden.
- **Persistence:** only the single-player world snapshot is saved locally in early phases. Save after atomic transitions. Treat storage input as untrusted, validate and migrate by version. The server later owns shared and competitive state. Never put credentials, private prompts, or provider responses into RPG saves.
- **Live arena:** existing HTTP/SSE proxy is the live-model boundary. Challenge version, model id/version where known, evaluation settings, outcome status, and request id belong in a match record. Provider secrets exist only during an authorized call and never in public match DTOs.
- **Multiplayer:** deferred until identity and room authorization exist. The browser sends intents, not authoritative positions, HP, quest completions, or rewards. Server validates and broadcasts sanitized state.

## Data contracts to establish before implementation

Use stable string ids, explicit schema versions, runtime validation at I/O boundaries, and tests for malformed data. The current JavaScript stack can use small validation functions and JSDoc types; adding TypeScript or a schema package is a separate measured decision.

```js
// Illustrative future shape, not the current flat WorldSaveV1 schema.
WorldSaveV1 = {
  version: 1,
  chapterId: 'lantern-signal',
  locationId: 'frontier-crossing',
  player: { x: 8, y: 6, hp: 30, xp: 0, level: 1, factionId: null },
  questStates: { 'lantern-signal': 'available' },
  flags: {}, inventory: [], discoveries: [], checkpointId: 'frontier-gate'
};
// No apiKey, credential, auth token, raw model output, or private prompt field.
```

`RegionDefinition`: id, tile dimensions, palette, collision layer, entrances/exits, interactions, NPC ids, encounters, music/ambience ids. `QuestDefinition`: id/version, prerequisites, objective predicates, rewards, dialogue refs. `RpgEncounter`: id, enemy stats/intents/abilities, reward id. `HistoricalEvent`: factual summary and cited sources; `LoreAdaptation`: fictional text and historical event id. `AiChallenge`: id/version, supported capability, input fixture, evaluation type, budget, public scoring description.

## Tests and integration order

Test pure world rules (bounds, collisions, interaction range, quest prerequisites, one-time rewards, combat replay, save migration) before browser integration. Browser tests then cover first launch → quest completion → save/reload → arena entry/return at desktop and narrow mobile. Mock provider calls for automated live-arena integration tests; reserve real credential smoke tests for explicit, budgeted manual verification. Check loaded asset size, memory, and frame time on a mid-range phone before expanding regions.

## Current risks to resolve, not assumptions to hide

The key helper is now memory-only and retires old browser-stored copies on boot. The streamed battle stops subsequent calls after disconnect and public battle errors are generic; an already sent provider call can still be billed. Preflight errors and full provider behavior need a separate audit. Judge-only scores do not establish fair benchmarking. Existing displayed fighter stats are game presentation rather than tested model performance. The fixed 960×540 arena wrapper scales text and controls too small on phones. Replay URLs carry result data and show a recap, not a verified full replay. Track fixes in [ROADMAP.md](ROADMAP.md); no document change makes these features safe or complete.
