# AI Frontier development blueprint

Status: first playable chapter and the Phase 2 faction branch are implemented; the later phases remain planned. [The repository README](../../README.md) describes what currently works.

## Product decision

AI Frontier is a browser RPG about exploring a fictional world shaped by AI history. The player moves through connected regions, meets characters, completes quests, develops a character, and fights keyless tactical encounters. A dedicated arena preserves the existing real-model battle feature. Providers inspire factions; supported models become distinct characters. Fictional abilities and balanced stats must never be presented as measured model performance.

The first release target is one short, replayable chapter in a compact connected world. Expand only after players can complete it without developer assistance. Do not advertise multiplayer or an open world until those features work.

## Read in this order

1. [Game and content design](GAME_DESIGN.md) — player promise, modes, first chapter, art and UX.
2. [Architecture and file structure](ARCHITECTURE.md) — existing code ownership, proposed modules, data contracts.
3. [Phased implementation plan](ROADMAP.md) — build order, acceptance gates, tests, current status.
4. [AI, credentials, and multiplayer](AI_AND_SECURITY.md) — challenge fairness, credential lifecycle, later shared play.
5. [Original character atlas](CHARACTERS.md) — provider-to-character identity and art constraints.
6. [Built-in model review](MODEL_COMPATIBILITY.md) — sourced model IDs and lifecycle caveats; no live availability claim.

The user's detailed AI Frontier brief is the source for this plan. Existing root-level [GAME_DESIGN.md](../../GAME_DESIGN.md), [ROADMAP.md](../../ROADMAP.md), [TODO.md](../../TODO.md), [MARKETING.md](../../MARKETING.md), and [PRODUCTION_BIBLE.md](../../PRODUCTION_BIBLE.md) describe earlier arena or platform directions. Preserve them for context; resolve conflicts in favor of this blueprint. [PRODUCT.md](../../PRODUCT.md) and [DESIGN.md](../../DESIGN.md) document the **current** arena UI until replacements ship.

## Decisions already made

| Decision | Reason | Revisit when |
| --- | --- | --- |
| Keep React, Vite, PixiJS 8, Express, and Node tests | They already run and cover the live arena | A measured requirement cannot be met with this stack |
| Pixi draws exploration and battle scenes; DOM draws text, menus, and forms | Readability, accessibility, responsive controls | Real usability testing finds a better boundary |
| Offline combat uses game rules; live arena results require real API responses | Core game must work without credentials | Never blur these result types |
| Save single-player progress locally first, using a versioned schema without keys | No account/database exists yet | Account-backed sync ships |
| Build three dense connected locations before a larger map | Discovery density matters more than acreage | First chapter is complete and fun |
| No new database, auth, or socket package for the first chapter | Those belong to a tested multiplayer design | Phase 5 begins |
| Keep the present arena callable from an in-world destination | Preserve working functionality | A better integration is proven |

## Current playable slice

The title and local save flow, three connected Pixi regions, one complete quest and relay puzzle, keyless tactical encounter, journal/map/pack, and arena portal are implemented. Three factions now begin in different regions, choose one of two mandates, meet a named ally, and earn a persistent, one-time bonus. The lore codex distinguishes source-backed AI history from fictional adaptation. This is still a **vertical slice**: no additional chapter, multiplayer, equipment system, or measured performance budget is claimed. Phase 1's remaining accessibility, audio, mobile arena, and provider verification work is tracked in [ROADMAP.md](ROADMAP.md).

## Working rules

- Each phase gets a small implementation plan listing files to touch and a playable acceptance path.
- Add data definitions and tests with the system that consumes them; do not create empty source directories or placeholder screens.
- Test desktop and mobile widths, keyboard and touch, normal and reduced motion.
- Mark features implemented only after a working path is exercised. Keep unbuilt work labeled planned.
- Source significant historical claims when adding lore. Fictional adaptation stays visibly separate from the source record.
- Record a decision here when it changes a boundary, save format, credential behavior, or player promise.

## Phase 2 implementation decisions

- `shared/rpg/factions.js` owns faction identity, mandate prerequisites, reward definitions, and the ally mapping. `shared/rpg/worldState.js` owns one-time claim and combat effects, so DOM controls cannot award items directly.
- World saves use `ai-frontier:save:v2`. The loader accepts the previous v1 key and introduces the chosen faction on resume; no credentials are saved. `shared/rpg/worldState.test.js` covers migration and corrupted-v2 fallback.
- `shared/rpg/lore.js` stores the fact, source, and visibly separate fictional adaptation. The game makes no claim that character stats measure real providers.
- `client/src/components/creatures/pixelData.js` owns the nine original provider silhouettes and their shared RPG/arena mapping; [CHARACTERS.md](CHARACTERS.md) records the visual contract.
- Faction rewards are simple chapter-scale modifiers; equipment, character progression, and objective AI challenges belong to later phases.
