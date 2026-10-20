# Phased implementation plan

This is the active RPG roadmap. Each phase ends with a user-visible path and a test gate. A checked audit item means verified **today**, not that later phase work is finished. Do not treat earlier root-level arena roadmaps as current.

## Phase 0 — Audit and architecture (documented)

- [x] Identify stack: React/Vite/PixiJS 8 client, Express server, SSE, shared JavaScript, Node test runner.
- [x] Inventory the working arena and the missing RPG, persistence, identity, and multiplayer systems.
- [x] Run baseline unit tests: 19 pass on 2026-10-18.
- [x] Run baseline production client build: passes, with a >500 kB Pixi chunk warning.
- [x] Map reusable code and produce this blueprint.
- [ ] Profile current client on a representative mobile browser; baseline performance is unmeasured.
- [ ] Review real provider compatibility with documented, current model IDs before claiming live support.

The first playable slice began after this audit.

## Phase 1 — Playable vintage RPG foundation

**Deliverable:** a player can begin without a key, explore three connected compact locations, interact with an NPC, complete The Lantern Signal quest, fight one offline encounter, see a changed world, save, reload, and continue. The existing live arena still works as a separate destination.

1. **P1-01 State and title.** Extend `client/src/game/gameReducer.js` and `App.jsx` with `TITLE`, `EXPLORE`, overlay, combat, and arena-return transitions. Add the title/continue/new-game UI under `client/src/rpg/screens/`. Do not mount the current arena Pixi stage before it is needed; keep replay-link handling intact.
2. **P1-02 World data and movement.** Add `shared/rpg/regions.js` with the three maps, exits, solid tiles, interactive objects, NPCs, and spawn points. Add pure movement/interaction rules and tests under `client/src/rpg/state/` or `shared/rpg/`. Implement keyboard, touch, and controller action mapping in `client/src/rpg/input/`.
3. **P1-03 Pixi scene.** Add `client/src/rpg/render/WorldScene.jsx` with cached nearest-neighbor art, tile/object layers, a bounded camera, and clean mount/unmount. Use native-size DOM HUD and dialogue over the canvas. Measure frame time and memory on desktop/mobile; adjust asset/animation work from measurements.
4. **P1-04 Quest and puzzle.** Add versioned quest/dialogue/item definitions in `shared/rpg/`; implement the guide, signal shard, relay puzzle, completion/reward, journal, and revealed map. Interaction range and one-time rewards are validated by pure state transitions.
5. **P1-05 Offline encounter.** Add a small deterministic three-action combat loop and one enemy with a readable intent. Include victory reward, defeat recovery, and tests. This is intentionally smaller than the fuller Phase 3 combat system.
6. **P1-06 Save and arena link.** Add validated `WorldSaveV1` and atomic local save/continue. A world portal opens the preserved live arena and returns to the saved position; entry clearly says that real model calls may cost money. Do not persist keys in world state.
7. **P1-07 Credential correction and UX QA.** Remove browser-persistent key storage from the existing arena, clear any prior stored key copies during migration, and provide explicit disconnect. Verify menu focus, touch targets, text size, reduced motion, audio opt-in, and small-screen layout. Avoid claiming a secure BYOK rollout until Phase 4's full review.

**Gate:** `npm test`, client lint/build, pure rule tests, and a real browser walkthrough at desktop and narrow mobile. Walkthrough: new game → movement/collision → NPC quest → change region → puzzle/item → offline fight → reward → reload → return to arena → back to world. No keys required for the first ten steps. Existing arena mocks/replay route must still pass.

**2026-10-18 implementation status:** the above chapter walkthrough has been completed in the browser, including mobile world/map layout and arena return. Rules, save validation, memory-only key cleanup, and disconnect-after-first-turn have automated tests. Source files are in `shared/rpg/` and `client/src/rpg/`; the original arena remains under `client/src/screens/` and `client/src/stage/`. This does **not** close Phase 1: gamepad controls, audio opt-in, focus management, reduced-motion audit, representative-device frame profiling, narrow-screen arena redesign, real-provider compatibility, and end-to-end provider mocks still need verification. Do not treat this slice as release-ready.

## Phase 2 — Factions, model characters, and sourced story

Build a faction selection and a complete introductory branch for each shipping faction. Add original character art and abilities, model compatibility metadata, dialogue choices, one ally, and persistent faction reputation. Historical lore uses dated, cited factual records linked to separate fictional adaptations. Verify provider/model descriptions against primary provider sources at implementation time; do not freeze current model claims into game canon.

**Gate:** each selectable faction has a distinct starting scene, meaningful quest choice, and save/resume. A reviewer can open each historical entry's source and distinguish fact from fiction. No fictional stat appears as an official benchmark.

**Implementation checkpoint (2026-10-20):** Wardens, Research Guild, and Observatory have separate starting regions, allies, two mandate options each, one-time rewards, reputation, and save-v2 persistence with v1 migration. The lore codex has three linked historical records with explicitly labeled fictional adaptations. Pure state tests and desktop/mobile browser checks cover faction entry and choice. Nine distinct original provider characters share a pixel atlas across the RPG and arena. The three built-in model IDs have [source-linked lifecycle metadata](MODEL_COMPATIBILITY.md), including a visible warning for the deprecated GPT-4o preset. This checkpoint does not imply live account compatibility, a measured balance pass, or the full Phase 1 accessibility/performance gate.

## Phase 3 — Deeper RPG combat and world

Expand the deterministic battle rules with equipment, status effects, enemy intents, boss phases, and balanced progression. Add connected locations only when each offers quests, clues, or useful rewards. Introduce an inventory/equipment UI, checkpoint and region unlocks, and a full quest journal/map. Keep local simulation independent of provider availability.

**Gate:** complete a multi-location chapter, use equipment and abilities meaningfully, defeat a boss, recover from defeat, and resume at a checkpoint. Combat action sequences reproduce the same outcome in tests.

## Phase 4 — Secure BYOK and real AI challenges

Preserve the current entertainment arena while improving its real request path. Move credentials to transient memory; add clear connection/consent/disconnect states, timeouts, cancellation, model/provider allowlists, bounded requests, redacted errors, security headers, and measured cost/usage disclosure. Add versioned objective challenge definitions and deterministic scoring alongside explicitly subjective entertainment matches. Build tests for the full request path and credential absence from saves, logs, errors, result URLs, and public DTOs.

**Gate:** a player voluntarily connects a supported provider, approves a bounded real challenge, inspects exact output and score method, cancels or completes it, and disconnects. Refresh never restores a key. Unsupported provider/model and outbound URL attempts are rejected. Do not claim ranking fairness until task inputs, versions, scoring, and failure states are reproducible.

## Phase 5 — Small multiplayer slice

Design player identity, session expiry, room authorization, and persistence before adding sockets. Start with two players in one shared hub and server-validated movement/presence; then one cooperative quest interaction. Only afterward add synchronized combat or competitive AI challenges. Each participant authorizes their own billable calls; no shared key, prompt, or private result crosses player boundaries. Rate-limit intents and verify rewards server-side. Avoid a public leaderboard until anti-cheat and scoring audit pass.

**Gate:** two independent browser sessions join a room, see each other, complete a supported co-op action, reconnect safely, and cannot forge position, rewards, match outcome, or another player's provider call. Add concurrency and disconnect tests. No MMO-scale claim.

## Phase 6 — Release readiness

Polish licensed/original sprite animation, lighting, atmosphere, transitions, audio, menus, errors, accessibility, responsive controls, localization readiness, and recovery. Run performance profiling and adjust large asset or ticker costs. Set up deployment config, automated build/test/security gates, monitoring without credentials, backup/migration plans for any server data, and a controlled player test.

**Gate:** no critical failures in the complete chapter and arena flows; playable on supported desktop/mobile browsers; documented frame time and load budgets on target devices; security regression tests pass; implemented scope matches public descriptions.

## Cross-phase quality checklist

For every vertical slice, verify: first-time instructions, mouse/keyboard/touch, scene exit and return, save/reload, failure and retry, narrow viewport, reduced motion, and readable text. Run pure unit tests for rules, integration tests for save and network boundaries, and one browser walkthrough for the whole path. Use test fixtures for provider failures; never spend a user's API credits during automated tests.

## Scope and market checkpoint

Do not add more factions, regions, modes, multiplayer features, shops, or monetization while the first chapter is incomplete. Recruit a small group of target players, observe unguided first sessions, and use quest completion, second session, confusion points, and voluntary arena use as evidence. Spending willingness and per-session provider cost must be measured before pricing. The current project has no evidence that a large open world or ranked multiplayer will retain players.
