# Cogimon — adventure, identity and arena delivery plan

Implementation plan · 2026-11-04

## Product decision

Cogimon is an original, GBA-inspired companion RPG played in a browser. The player is a human trainer, not a provider logo. A free, deterministic adventure builds attachment to a small team; optional real-model battles provide a separate competitive spectacle. Adventure levels and cosmetics never change live-model combat power.

The approved visual lane is the panoramic entrance and detailed, daylight village from [redesign-v3](redesign-v3/README.md). This plan supersedes that package's **planning-only** stop condition, not its original-character/art-quality requirements. The coaching proposal remains a possible later experiment: real AI is not called during ordinary creature fights.

## Two connected loops

1. Begin/continue → meet a companion → explore → solve quests → fight → restore the world → receive a memorable reward.
2. Inspect/equip the reward in the Locker → preview your identity → optionally enter the live arena → inspect the result → return to the adventure.

The first loop must be worthwhile without a provider account, payment, public audience or multiplayer opponent. Cosmetics/public display are a retention hypothesis, not evidence of market demand.

## Modes and honest labels

| Mode | What the player does | Persistence | Model calls |
| --- | --- | --- | --- |
| Journey | Trainer/starter setup, Lantern Signal quests, recruitment, creature encounters, puzzle, boss, restored-town homecoming | Local adventure save | None |
| Practice | A disposable encounter with immediate retry/exit | No story XP or reward claims | None |
| Rival Circuit | An authored local sequence with recovery/retry | Local circuit record, separate from Journey | None |
| Live Arena | Existing Roast, Injection and Impersonation model shows | Existing separate recap/replay | BYOK, explicit consent |
| Invite Duel, later | Two real players independently approve a bounded match | Server-owned match and verified profile snapshot | Only with each owner's consent |

The current arena configures both fighters in one browser. Do not relabel it human PvP or ranked matchmaking. Do not add misleading active matchmaking controls before the online flow exists.

## Player experience, screen by screen

### Entrance and onboarding

- A scenic, original pixel-art title; game menu rather than a website hero plus feature cards.
- Continue shows trainer, lead companion and last region. Begin Journey requests a short trainer name and lets the player inspect all three starters before confirming.
- Starters: Emberquill (protective Ember owl), Kitewhisk (fast Grove fox), Duplet (Tide pair). Provider relationships are secondary lore, not claimed real-world power rankings.
- Explicit replacement confirmation protects an existing save. Migration retains the old save until a valid new save is written.
- Practice is available without setup; live provider credentials are never required to enter the adventure.

### Journey

- A human trainer moves through an authored town, route and Archive with a following companion, readable landmarks, signposts and keyboard/touch controls.
- A compact quest tracker shows one next action. Journal contains discovered leads, not spoilers for every future step.
- NPCs give short dialogue and meaningful next directions. Rest, team management, pack and save/title remain reachable.
- Each encounter has a dedicated battlefield: opponent upper-right, companion lower-left, labelled HP/energy, readable intent and four command groups (Fight, Team, Pack, Retreat).
- Failed encounters preserve quest progress and return the team to a safe rest point. Retreat does not grant completion. Refresh restores a stable state without duplicating rewards.
- Boss access follows quest evidence and mechanic understanding. Main-path quest XP is sufficient; repeated farming is never required.
- Restoration visibly changes the town. The reward reveal names what was earned and offers an immediate Equip/Open Locker path.

### Locker and identity

- Preview the lead companion, trainer name, title, skin, up to three distinct pinned badges and worlds cleared.
- Show owned, equipped and locked states with the actual unlock condition. Replacing equipment never deletes an unlock.
- Stable catalog IDs, not image blobs, are saved. Unknown IDs, unowned equipment and incompatible character skins are rejected.
- Local rewards explicitly say **Local / unverified**. They cannot silently become official public achievements later.
- Cosmetic appearance may use an aura, palette treatment or accessory only when the asset exists; no invented purchase or inventory counts.

### Arena introduction and return

- Extend `screens/Vs.jsx`; do not build a competing live-match route.
- Present companion identity and model identity as separate concepts. Adventure level is labelled prestige, never a PvP stat.
- Keep a short, skippable introduction with reduced-motion support. No provider calls occur in the introduction.
- Freeze the selected identity for the match. Results/rematch/exit retain working cancellation, provider validation and replay behavior.
- A local preview may show an example rival, clearly labelled as a preview, and must never dispatch a paid match.

## First world: The Lantern Signal

| Area | Purpose | Main beats | Payoff |
| --- | --- | --- | --- |
| Frontier Crossing | Recognisable home hub | Meet Mara, start the signal quest, rest, inspect board, practice | A lantern landmark that changes after restoration |
| Moss Circuit | Learn through a route | Recover a shard, read an enemy telegraph, recruit a second companion | Team switching and a shortcut home |
| Forgotten Archive | Apply knowledge | Read a sequence, restore a relay, fight the Archive guardian | Return home and earn the Lantern identity set |

The initial authored chapter is deliberately smaller than three regions with four quests and a mini-boss each. Expand only after this complete loop is tested. Reuse encounter/quest/reward systems; do not duplicate entire maps as differently colored worlds.

Signature mechanic meanings:

- Ward: follow a constraint and protect something specific.
- Recall: apply an earlier clue at the correct moment.
- Fork: compare plans and commit to a branch.
- Overcharge: spend a bounded resource for a stronger action.

These are understandable game mechanics inspired by AI concepts, not demonstrations of autonomous live models. A later second-world spike must change objectives and decisions, not merely art.

## Rewards and fairness

Catalog types: skin, badge, title, emote/add-on when supported. Codex discoveries stay in the journal/profile. Companion XP, team stats and items belong only to local creature combat.

Initial stable IDs: `skin-lantern`, `badge-lantern-signal`, `badge-static-clear`, `badge-archive-warden`, `title-lantern-keeper`. Standard/base appearance is always available. Rewards are one-time grants derived from chapter state; Practice and replay cannot mint them.

Before ranked or public competitive claims: publish allowed model pool, rule version, task, prompt restrictions, maximum rounds/output/calls, judging rubric, cancellation/failure policy and dispute limits. Current subjective model judging is entertainment, not an objective universal ranking. Start online with unranked invitation matches.

## Technical ownership and structures

Keep React, Vite, PixiJS 8 and Express. No new game engine, ECS framework or backend service is necessary for the local slice.

```text
shared/rpg/
  adventureContent.js       # companions, authored regions, encounters, quests
  adventure.js              # pure turn/world reducer and selectors
  adventureSave.js          # validated v3 snapshots and old-save import
  adventure.test.js         # complete loop, losses, retries, one-time claims
  profile.js                # catalog, local profile, equip validation, snapshot
  profile.test.js           # unknown/unowned IDs, duplicates, corruption
client/src/rpg/
  JourneyTitle.jsx         # active panoramic menu, trainer and starter setup
  Adventure.jsx            # journey/practice/circuit and shared game menus
  AdventureScene.jsx       # Pixi tile world, actors and camera
  CompanionArt.jsx         # original character portrait/battle presentation
  FieldMap.jsx             # actual paths, landmarks and player position
  Locker.jsx               # equipment and identity preview
  locker.css
  journey.css              # coherent GBA frames/tokens/responsive UI
client/src/screens/Vs.jsx  # extend existing live-match introduction
client/public/assets/frontier/
  # selected production assets plus source/provenance manifest
docs/ai-frontier/
  PROGRESSION_PLAN.md       # this contract
  WORK_LOG.md               # evidence and checkpoint state
```

Split only when a real system needs it. `Title.jsx`, `World.jsx`, `WorldScene.jsx` and `worldState.js` are legacy/reference modules, not the active Journey route; the old rules remain available for save import/tests. The UI-safe persistence boundary is `client/src/lib/adventureStorage.js`. Never save credentials, provider response text or an arbitrary transient React panel in an adventure/profile snapshot.

## Integration contracts for the first implementation

### Adventure lane

`adventureContent.js` exports `COMPANIONS` (array with id/name/affinity/role/description/color), `STARTER_IDS`, `ADVENTURE_REGIONS` (region records with width/height/spawn/path/solid/objects/palette), `ENCOUNTERS`, `MOVES` and `QUESTS`.

`adventure.js` exports `createAdventure({trainerName, starterId, mode})`, `adventureReducer`, `activeCompanion`, `nearbyInteractable`, `adventureObjective`, `questProgress` and `unlockedRewardIds`.

State includes version, mode (`journey`, `practice`, `circuit`), trainerName, starterId, team, activeId, locationId/x/y/facing, flags, inventory, battle, result, dialogue and message. Team members expose id/name/affinity/level/xp/hp/maxHp/energy/maxEnergy/moves. Dialogue exposes speaker/text. Battle exposes encounterId/enemy (id/name/hp/maxHp/intent), turn and log. Result exposes outcome/heading/text/rewards. Region objects have id/type/x/y/name and optional encounterId/to/entry.

Actions: `MOVE {dx,dy}`, `INTERACT`, `DISMISS_DIALOGUE`, `BATTLE_MOVE {moveId}`, `SWITCH_COMPANION {companionId}`, `USE_ITEM {itemId,companionId}`, `RETREAT`, `CONTINUE_RESULT`, `REST`, `START_PRACTICE`, `START_CIRCUIT`. Invalid actions do not advance turns or create rewards. Export additional selectors rather than requiring the UI to recalculate rules.

`adventureSave.js` exports `ADVENTURE_SAVE_KEY`, `loadAdventure(storage?)`, `saveAdventure(state,storage?)`, `toAdventureSave(state)` and `fromAdventureSave(value)`. Use a distinct v3 key, preserve old keys, import a valid v2/v1 snapshot and map old hero IDs to the corresponding starter. Save/load errors remain visible to the player.

Implemented recovery additions: snapshots carry a stable `runId` and `mapRevision`. Pre-expansion v3 maps migrate to safe checkpoints, or the matching new encounter adjacency if a battle is active. A write from another run is rejected unless Begin Journey explicitly confirms `{replace:true}`. Circuit best records use the separate `ai-frontier:circuit:v1` key and are persisted at result boundaries. Shared save errors throw; the UI boundary converts them into usable recovery controls, including controls inside active native dialogs. This prevents stale-run replacement, not arbitrary same-run multi-tab conflict merging or public cheating.

### Identity lane

`profile.js` exports `COSMETICS`, `createProfile`, `loadProfile`, `saveProfile`, `syncAdventureProfile`, `equipCosmetic`, `profileSnapshot` and `getCosmetic`. A profile contains version, trainerName, companionId, level, worldsCleared, ownedIds, loadout `{skinId,titleId,badgeIds}` and verification `'local'`. Synchronization receives `{trainerName,companionId,level,worldsCleared,rewardIds}`. It is a local display projection, never a server-verification claim.

`Locker` accepts `{profile,onChange,onClose}` and has no dependency on the adventure reducer. The root owns saving and connecting these. `Vs` can use the frozen `loadout.identity` snapshot or a validated local profile fallback; opponent identity must not be fabricated as another real player.

## Online architecture, explicitly later

1. Server-issued anonymous session in a secure cookie; account recovery/linking is a separate product decision.
2. Durable player/profile/equipment tables with unique reward grants. Server validates owned, compatible catalog IDs.
3. Server-owned run/ruleset/seed and bounded action validation, or legal deterministic replay. A submitted `bossDefeated` flag is not proof. Legal replay still does not prove human/non-bot play.
4. Separate local imports from verified public unlocks. Never promote arbitrary local achievements.
5. Invitation → join → rules/budget approval from both owners → freeze profiles → execute → persist outcome → recap/rematch. Handle expiry, refusal, disconnect, retries and idempotency.
6. Keep provider secrets out of profile, match DTOs, replays and logs. A profile/room join is never permission to bill a provider key.

Select persistence/hosting against deployment requirements before implementing the online lane. No production account creation, new paid service, public deployment or credential change is implied by this local implementation.

## Delivery checkpoints

| Phase | Deliverable | Acceptance gate |
| --- | --- | --- |
| P0 | Full plan, ownership, dependencies and preserved baseline | Scope and migration contracts documented; focused commit/push |
| P1 | Pure chapter/party/combat and save migration | All starters can complete quests/boss/homecoming; win/loss/retreat/idempotency tests |
| P2 | Panoramic entrance, coherent exploration and dedicated battle/results | Complete keyboard/touch title-to-reward path; save/continue and error states |
| P3 | Catalog, Locker and live/preview Versus identity | Unknown/unowned IDs rejected; equip persists; three badge limit; no preview calls |
| P4 | Practice and Rival Circuit plus integration hardening | Entry/play/result/retry/exit without contaminating Journey rewards |
| P5 | Verified profiles and unranked invite duels | Requires selected server persistence/session design; server replay/ownership/consent tests |
| P6 | Distinct second-world spike and release validation | Different mechanic; observed player sessions and measured target devices |

Each accepted phase receives a focused commit and push as the user requested. Independent branches integrate only after checking their scope and running the corresponding checks. P0–P4 are the immediate local implementation target; P5–P6 are not represented as complete by a local-only build.

## Test and release gates

- Node tests: complete chapter for every starter, route reachability, affordable/invalid moves, switches, finite battles, defeat/retry/retreat, quest prerequisites, one-time XP/rewards, mode isolation, save corruption/import/resume and catalog validation.
- Retain provider, endpoint validation, judge failure and abort tests. Automated checks never use billable live providers.
- Browser walkthrough: begin/continue, inspect starters, navigation, dialogue, tutorial fight, recruit/switch, puzzle, boss, homecoming, reward/equip, preview/arena return; loss and retry; refresh at a stable battle turn.
- Layout checks at 360×740, 390×844, 1280×720 and 1440×900; keyboard focus, reduced motion, readable disabled states, long names and storage failure. Distinguish UI inspection from real touch-device testing.
- Measure scene frame time and memory on available hardware. Target 60 Hz movement, pause hidden scenes, cache textures, no full-map redraw per step. Do not claim midrange-phone performance from a desktop test.
- Art sources and generation prompts are retained. Concepts may be used as inspected portrait references; production map and battle artwork need their own declared dimensions/anchors. No external company logos or copied game assets.
- Observe at least five new players before claiming market fit. Track unaided start, first fight understanding, chapter completion, voluntary equip and actual second-session return. Do not invent targets as measured results.

## Non-goals and risk register

No open-world multiplayer, ranked ladder, real-AI-per-creature-turn, monetisation, paid cosmetics, vendor-logo skins, public anti-cheat guarantee or autonomous NPC service in the local slice. The main risks are content quality, art consistency, weak attachment, repetitive encounters, subjective live judging and unverified local state. A complete local loop reduces implementation uncertainty; only playtesting reduces the enjoyment/retention uncertainty.

## Structured exploration extension · 2026-11-05

The story direction is a structured main chapter with optional routes, secrets and side quests. [World and story](WORLD_AND_STORY.md) records the implemented Lantern Signal beats, character stakes, the new Sunward Pass route and honest proposals for the next acts. Sunward opens after the Static Wisp: its northern clue/recovery/return quest grants supplies once, while its southern memorial road leads to a persistent overlook discovery. It rejoins the existing chapter without changing main XP, cosmetics or completion gates. The field map and optional objective make the detour findable.

The extension preserves revision-2 coordinates through a passable trailhead and narrowly migrates only the new optional fields. Automated checks cover each starter’s side route, reward idempotency, region reachability and old/nested/active-battle saves. This is added chapter content, not completion of P6’s distinct second-world or observed-player validation gate.
