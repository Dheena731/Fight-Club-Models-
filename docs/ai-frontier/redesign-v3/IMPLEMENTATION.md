# Build plan and file ownership

Proposed plan · 2026-11-04 · The review package contains concepts and specifications. None of the modules below should be created as empty scaffolding.

## Build boundaries

Keep React, Vite, PixiJS 8 and the existing Express arena. React owns text, commands, focus, menus and forms. Pixi owns the title's scene layers, tilemap, actors, battle staging and effects. Pure shared rules own movement legality, battle outcomes, progression and reward claims. A scene's animation must never own a reward or change saved combat values.

Retain working provider, cancellation and replay code during the visual migration. Existing local quest history is preserved through a versioned import. Do not add an account system, multiplayer backend or new game engine to achieve this redesign.

## Planned source structure

```text
client/src/rpg/
  screens/
    TitleScreen.jsx          # panorama, save preview, practice/settings entry
    TrainerScreen.jsx        # name and appearance
    StarterScreen.jsx        # inspect, choose, bond
    ExploreScreen.jsx        # world shell and context interaction
    BattleScreen.jsx         # commands, targets, event presentation
    TeamScreen.jsx           # reorder, swap, inspect
    CompanionScreen.jsx      # portrait, moves, bond and next unlock
    JournalScreen.jsx
    MapScreen.jsx
    PackScreen.jsx
    ResultScreen.jsx
    SettingsScreen.jsx
  render/
    GameCanvas.jsx           # one canvas lifecycle per active game surface
    TitleScene.js
    OverworldScene.js
    BattleScene.js
    SpriteActor.js           # frame, facing, foot point, animation state
    assets.js                # atlas manifest and scene-specific loading
    camera.js
    transitions.js
  ui/
    PixelFrame.jsx
    DialogueBox.jsx
    CommandMenu.jsx
    HealthBar.jsx
    PartyStrip.jsx
    AffinityMark.jsx
    SaveSlot.jsx
  input/
    actions.js               # shared confirm/back/move/menu intents
    keyboard.js
    touch.js
    gamepad.js
  state/
    rpgReducer.js
    selectors.js
    saves.js
  theme.css

shared/rpg/
  companions.js              # stable species IDs, roles, stats, art IDs
  moves.js                   # costs, priority, power, effects, learnsets
  battleRules.js             # pure validation, round resolution, events
  encounterRules.js          # enemy policy, seed, ruleset and rewards
  progression.js             # XP, levels, bond and one-time grants
  worldRules.js              # grid, movement, interaction and doors
  saveSchema.js              # validation and v2 -> v3 import
  content/
    encounters.js
    quests.js
    dialogue.js
    maps/
      frontier-crossing.json
      companion-guild.json
      healing-garden.json
      moss-circuit.json
      forgotten-archive.json

client/public/assets/frontier/v3/
  manifest.json
  title/                     # separate background, foreground and logo
  trainer/                   # portrait and movement/send-out sheets
  companions/<companion-id>/  # portrait, field, front, back, icon
  tilesets/
  battlefields/
  effects/
  ui/
  audio/
  fonts/
```

Split files as the owning system becomes real. Start battle rules in one readable pure module; extract separate damage/status/AI modules only when the implementation warrants it. Keep the current code available until each replacement flow works.

## Migration map

| Current owner | Replacement responsibility |
| --- | --- |
| `client/src/rpg/Title.jsx` | `TitleScreen` plus title scene, save slots and starter route |
| `World.jsx` | `ExploreScreen`, shared menu surfaces and an independent `BattleScreen` |
| `WorldScene.jsx` | Layered `OverworldScene`, animated actors, camera and asset loader |
| `frontier.css` | Shared game tokens and frames applied across all RPG and arena surfaces |
| `components/creatures/pixelData.js` | Stable identity bridge until real atlases replace the code grids |
| `shared/rpg/world.js` | Authored content and companion/move definitions |
| `shared/rpg/worldState.js` | Separate world, battle, progression and save rules |
| `shared/rpg/factions.js` | Guild relationships and later quest branches, introduced during play |
| Existing arena screens | Shared visual treatment while retaining their real-output request flow |

## Production art contract

The generated PNGs under this review package are appearance references. A one-piece generated title screenshot cannot supply parallax layers or accessible interactive menu text. A large character illustration cannot be treated as a cleaned 96px sprite by shrinking it blindly.

| Asset | Planned logical size | Required exports |
| --- | --- | --- |
| Title scene | 640×360 landscape plus intentional mobile composition | Background layers, foreground trainer/companions, logo; menu text separate |
| Terrain | 16×16 tile grid | Ground, shore/path transitions, collision, object, canopy/roof layers |
| Trainer | 24×32 per field frame | Four directions × four frames; interact, send-out, victory |
| Companion field sprite | 24×24 or 32×32 footprint | Four directions × four frames; common foot baseline |
| Companion battle art | 96×96 front and 96×96 back | Idle, anticipation, action, hit, faint, celebration; allow declared oversize exceptions |
| Dialogue/profile portrait | 128×128 | Normal, happy and concerned where used |
| Party icon | 24×24 | Ready/active/fainted states conveyed in UI |
| Battle scene | 480×270 landscape logical scene | Region-specific foreground/platform and background, independent of DOM controls |
| VFX | Move-specific bounded frame box | Shared frame timing, anchor and reduced-motion alternative |

Each atlas records frame dimensions, frame rectangles, pivot, foot point, animation names, duration and source/licence. Use nearest-neighbour sampling and integer scale for artwork when the viewport allows it. Letterbox/crop the scene deliberately when necessary; do not distort characters or reduce button/text size to fit. Keep combat sprite scale consistent across the roster while allowing natural species height differences.

Author tilemaps in an editor-compatible JSON format with separate collision and interaction layers. Draw once per map/viewport change, update actors per frame and cache loaded textures. Pool repeated short-lived particles if profiling shows churn. A component/ECS framework is unnecessary for this chapter.

## Save and scene contracts

`WorldSaveV3` contains a trainer identity, companion instances, three active-party instance IDs, reserves, map/position/facing, checkpoint, quests, guild relationships, inventory, settings and an optional battle snapshot at a stable command boundary. Companion instances reference stable content IDs and own level, XP, HP, energy, equipped moves, nickname and bond. Provider credentials never belong to the world or party model.

Import the old v2 hero (`owl`, `fox`, `serpent`) as the corresponding starter companion; retain chapter completion, inventory/reward equivalents and guild history. Map old coordinates to a named safe checkpoint in the new content instead of reusing invalid positions. Keep the original v2 storage entry intact until import succeeds, validate the new snapshot, and show a concise import summary. Starting a separate adventure uses another slot or an explicit overwrite choice.

Battle resolution commits a stable model, then emits a transient event queue for presentation. On refresh, resume the saved command boundary with a clear short resume message. Visual fast-forward applies the committed result; it never reruns a reward. Practice has its own disposable state. Circuit checkpoint data is separate from story reward claims.

## Checkpoints and commit gates

Each checkpoint ends with a working path, proportional checks, updated documentation, a focused commit and a push. Do not call a checkpoint done because its title screen is finished.

| Checkpoint | Deliverable | Gate |
| --- | --- | --- |
| R0 · direction review | This complete plan, title/world/battle probes, nine companion avatars and trainer concept | Review appearance and battle presentation; record requested changes before implementation |
| R1 · production art foundation | Three starter art sets, trainer, one town tileset, common frames/fonts/audio, layered title | Actual-size title, town and battle renders meet one art direction on desktop and mobile; asset sources/licences recorded |
| R2 · first complete loop | Title → trainer → starter → guild scene → guided battle → result → save/continue | Every starter completes the loop; win/lose/retry, controls, refresh and save errors exercised |
| R3 · chapter and attachment | Connected town/route/Archive, recruitment, party switching, rest, quest/puzzle, boss and homecoming | Finish chapter with each starter, return after defeat, replay no one-time rewards; world changes are visible |
| R4 · roster and modes | Nine finished companion sets, learnsets/progression, Practice, Rival Circuit, coherent live arena shell and result screens | Each local mode has a complete entry/play/result/retry/exit path; retained arena mocks and replay route pass |
| R5 · release candidate | Final sound/motion, accessibility, performance, recovery and observed player sessions | No critical failures, documented target-device measurements and fixes from playtests |

## Verification that matters

Test pure battle scenarios around energy boundaries, speed ties, switch timing, item targets, status duration, faint handling, seeded reproduction and reward idempotency. Test map reachability, door returns, quest prerequisites and save migration/corruption separately. Existing provider/cancellation tests remain valuable; do not spend user credits in automated tests.

Walk the entire title-to-homecoming path at 360×740, 390×844, 1280×720 and 1440×900. Include long nicknames, keyboard-only play, touch, a standard gamepad, muted sound, reduced motion, tab suspension, asset-load failure and a failed local save. Verify focus return and readable active/disabled command states. Check portrait transparency, frame bounds, foot points and animation timing in the actual renderer.

Initial performance budgets to measure on a representative midrange phone: responsive 60Hz movement/rendering with p95 frame time at or below 16.7ms in ordinary play, title interaction within 3 seconds on the chosen test connection, first-use compressed JS around 350KB or less, title art around 800KB or less, and scene-specific loading for the remaining chapter art. Record the device, browser, connection and measured outcome. These are targets, not results. Pause inactive scenes and hidden-tab tickers; measure memory after repeated world/battle/title transitions.

## Player and market checkpoint

The target is someone who enjoys short creature-RPG adventures and can try a browser game immediately. AI enthusiasts are a useful initial audience, but the first chapter must motivate play through companions, discoveries and decisions. This is a hypothesis to test, not demonstrated market demand.

Observe five first sessions, including experienced handheld-RPG players and AI-curious newcomers. Record whether they start unaided, choose a companion, understand the first turn, find the first destination, switch for a reason, finish the chapter and choose to return later. Ask what they remember after play; watch actual second sessions. Measure completion time before promising a session length, and learn where enjoyment drops before adding regions, online modes or monetisation.

## Current review boundary

The approved title/world lane is recorded. The next review is about companion attachment, battle composition and the first-chapter loop. Once those are settled, begin R1 and R2 in dependency order. Do not silently load these high-resolution concepts into the current renderer or call the live game redesigned at this planning checkpoint.
