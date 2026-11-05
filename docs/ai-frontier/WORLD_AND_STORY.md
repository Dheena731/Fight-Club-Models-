# Cogimon — world and story

Current playable chapter and expansion direction · 2026-11-05

## The promise

A human trainer and an original companion restore the small lights that let people find their way home. The main story gives the journey a destination. Optional roads let the player decide whose troubles to hear, which places to remember, and when to come back. Exploration, clues and character stakes stay deterministic and playable without an account or provider calls.

This is a connected, authored first chapter across seven regions, with an optional outer route and a focused side quest. A second chapter, autonomous NPCs and multiplayer are not implemented. Large empty fields do not count as more adventure.

## Chapter one: The Lantern Signal — implemented

The relay lantern in Frontier Crossing has gone dark. Mara cannot leave her post while travelers depend on the crossing. The player can leave, learn what broke, and carry the signal home. The mystery becomes a practical promise: the shard, the remembered sequence and the final watch all contribute to making the town safe again.

| Beat | Place and action | What the player learns |
| --- | --- | --- |
| A light goes out | Meet Mara beside the town lantern | The crossing needs someone who can travel beyond it. |
| Recover a fragment | Take the east road into Moss Circuit and recover the Signal Shard | Roots and old signal works share the same landscape. |
| Read an opponent | Defeat the visible Static Wisp | An enemy’s gathering turn leaves an opening; Ward answers the surge. |
| Choose a companion and a detour | Revisit Ivo to recruit Mossback; optionally take the eastern pass | People and routes remain worth revisiting after a fight. Neither the recruit nor the detour is required for completion. |
| Remember before acting | Read Neri’s Archive notes; enter amber, then cyan at the relay | The record offers a usable clue rather than decorative lore. Recall also gains its documented opening bonus. |
| Finish the watch | Defeat the Archive Warden beyond the restored relay | The final encounter uses the same readable intent rules. |
| Come home | Return to Mara | The town lantern visibly changes, the Lantern identity rewards unlock, and the chapter has an ending. |

Main progression remains Frontier Crossing → Moss Circuit → Forgotten Archive → homecoming. Sunward Pass can be visited after the Wisp, during the Archive journey, or after the ending. It never replaces the current main objective.

The longer exploration loop runs **Frontier Crossing → Amber Riverlands → Hearthbloom Orchard → Starfall Highlands → Sunward Pass → Moss Circuit → Frontier Crossing**. The river, orchard and highlands can be explored before starting the main quest. Their entrance to Sunward retains the existing Static Wisp gate, so the longer road cannot bypass the chapter’s established prerequisites.

## People worth returning to

- **Mara, the Keeper:** holds the town’s promise while the player works beyond its walls. Homecoming resolves her immediate need.
- **Ivo, the Scout:** teaches preparation through readable enemy intent and introduces Mossback after the Wisp. His route advice connects the optional pass to the existing world.
- **Neri, the Scholar:** turns a remembered record into the relay solution. The notes matter in exploration and combat.
- **Sela, the Routekeeper:** tends a smaller beacon above the crossing. Recovering her missing lens helps someone whose task will continue after the player leaves.
- **The chosen companion:** Emberquill protects, Kitewhisk finds openings, and Duplet remembers. Starter identities affect the available commands; all can complete the chapter. Mossback joins through an explicit local story action.

These are authored interactions. Persistent companion relationships, branching companion endings and simulated daily schedules are future work.

## Sunward Pass: an optional loop — implemented

The eastern trailhead in Moss Circuit is open from a fresh Journey, as is the road from the highlands. The pass is 36 × 24 tiles: a western arrival, an orchard switchback, a northern ridge, an old lookout, a southern memorial road and a quiet overlook. Rock terraces and tree banks separate the routes. The roads reconnect at the eastern ridge; no quest requires a menu teleport. The Archive alone retains the Wisp prerequisite.

```text
                       Wind Marker ─────────── old lookout / lens
                           │                           │
                    orchard switchback                │
                           │                           │
Moss Circuit ── Sela ────── fork ──────────────────────┤
                                           │          │
                                    Keepers’ Memorial ── Lantern Overlook
```

The northern route gives the missing-lens quest a clue, a destination and a return. The southern route gives that errand a reason to matter: a memorial names the work of earlier keepers, and the overlook lets the player see the crossing they are protecting. Its dialogue reflects whether the chapter lantern has already been restored.

### The Keeper’s Lens

1. Speak to Sela at the western trailhead. She explains the lost ridge-beacon lens.
2. Read the Wind Marker along the northern road. Its field note points east, then north beneath the old lookout.
3. Recover the lens at that lookout. The clue is required; finding the object early does not complete the quest.
4. Walk back to Sela. Returning the lens grants **two Field Tonics and one Signal Tea once**, bounded by the existing 99-item cap. The returned quest item leaves the pack, and the restored beacon reopens a two-way lift between the overlook and Market Street.

The quest grants no extra chapter XP or invented cosmetic reward. Its supplies can help with the existing Archive journey. Sela’s follow-up invites a visit to the southern memorial road. Reading Lantern Overlook records a separate, persistent discovery; it can also be found before returning the lens.

The HUD, journal integration and field map use a separate optional objective. The field map reveals terrain after a first visit, shows landmarks and keeps the main route understandable. Lantern Overlook remains visible and interactable in the world, but its map marker and coordinates appear only after discovery. The map then records it by name.

## The outer route — implemented

The title panorama promises a world that continues beyond the town square. Three larger regions carry that promise through connected roads, visible landmarks, smaller things to inspect and routes with different physical character.

| Region | Authored geography | Places to investigate |
| --- | --- | --- |
| **Amber Riverlands**, 56 × 40 | A full-height river divides the banks. Two bridges reconnect the northern orchard road and southern mill road. A narrow western tributary offers a jump shortcut; its banks also have a walking route. | Toma’s watermill, a flour-dusted mailbox, the waterfall viewpoint, a reedbank field tin and the millpond bench. |
| **Hearthbloom Orchard**, 48 × 36 | Cottage terraces overlook the lower fields. A central lane and western climbing holds reach the upper road. Irrigation bridges loop through the eastern garden. | Cottage mail, Bela’s garden, a keepsake box behind the upper lane, crates, flowers and an irrigation bench. |
| **Starfall Highlands**, 52 × 40 | Two switchbacks surround a broad cliff. Old holds allow climbing in both directions; a southern ledge offers a one-way drop. The observatory rises above the ruins. | First Keepers’ Tablet, Orrin’s telescope, an astronomer’s field box and a bench looking toward Sunward. |

Toma, Bela and Orrin connect practical village life to the chapter’s promise. Mail recalls the crossing; garden water comes from the same river that turns the mill; the observatory record describes the lights Mara keeps tonight. These details explain how the places depend on one another without inventing another main quest or faction.

Nine persistent discoveries record inspecting the mill, falls, river tin, cottage letter, kitchen garden, orchard keepsake box, ruins tablet, observatory and astronomer’s field box. Inspecting them grants no XP, consumables or cosmetics. The contents remain in the world. Hidden caches and the garden keep their exact map location concealed until discovered; ordinary landmarks remain useful for navigation.

### Jumping, climbing and ledges

Traversal happens only at authored, directed links. Stand on the marked start tile and face the crossing. The stream has east/west jumps; the orchard terrace has up/down climbing holds; the highland cliff has up/down holds and a separate one-way south ledge. Every main road and gateway has a walking route, so using a shortcut is a choice rather than an unexplained movement requirement.

The reducer accepts a canonical link, never an arbitrary destination. Its landing must be walkable. A traversal locks other actions until the matching animation completes; jump/climb/ledge durations are 420/760/320 ms. Position becomes the landing tile immediately, while transient animation data preserves the start and finish for rendering. Saving during traversal resumes safely at the landing without replaying animation. A ledge has no implicit reverse link.

### Ground and detail

Terrain distinguishes grass, dirt, stone, sand, mud, water and bridge surfaces. Authored terrain rectangles apply in order; later bridge rectangles override water. Water blocks walking, while bridges remain walkable. Trees, rocks, cottages, the watermill, ruins and the observatory use explicit solid kinds. Nonblocking pebble, flower, reed, stump, crate and waterfall details add material to the route. Decorative fences are placed on existing barriers, so visible fences do not introduce invisible collision rules.

Mailboxes, benches, waystones, field tins and the telescope are inspectable objects with their own short text. Their appearance and their interaction share the same map position. The region route hints, waystones and town signpost give directions to the new gates; no discovery requires guessing that a larger map exists.

## Inhabited Crossing and player-chosen routes — implemented

Frontier Crossing spans 64 × 48 tiles with six neighborhoods: the old lantern square, Market Street, Hearth Row, Makers’ Yard, Riverside Gardens and South Working Lane. Fifteen building exteriors use distinct inn, shop, townhouse, greenhouse, workshop and barn silhouettes. Eight town doors enter furnished rooms; Amber Watermill and the Starfall reading room bring the total to ten. Beds, shelves, counters, tables and walls have authored collision. Fifty-three new substantial street props also block movement; flowers and crops remain ground details. Residents have local dialogue and small idle animations, not simulated schedules.

Three independent errands connect places rather than a mandatory chapter sequence: flour for the night watch, a replacement mill bearing and Fern’s missing orchard recipe. Their ordered stages and once-only supply rewards persist without granting main-story XP. The inn, clinic and observatory cot offer recovery without free supply refills.

The open ring is Frontier → Moss Circuit → Sunward → Highlands → Orchard → Riverlands → Frontier, walkable in either direction before starting Mara’s quest. A reciprocal Moss–Orchard footpath creates another route choice. Two projects change that network:

- **Canal Ferry:** read the mill ledger, collect Rusk’s bearing and fit it at the inspection hatch. The repaired wheel powers a two-way crossing between the town boathouse dock and the mill bank.
- **Beacon Lift:** meet Sela, follow the Wind Marker, recover the lens and return it. The beacon reopens a direct two-way route from Market Street to the Sunward overlook.

Either project can be completed first. Their existing completion flags control the actual gateways and their locked/open presentation, so reloading preserves the changed routes. Walking alternatives remain open. The field map shows the route network and project benefits; selecting a region, known landmark or current project lead gives a next-gateway bearing in the HUD. Tracking never teleports the player. The destination pin is a session preference; quest and transport progress persist in saves.

## Content and save contracts

- The four existing regions preserve their solids, existing object and exit coordinates, and map revision. Frontier Crossing and Sunward gain passable outer-route gateways with short connecting dirt roads; Moss Circuit retains its passable Sunward trailhead. These visual road additions preserve walkability, so old saves occupying the gateway or approach tiles keep their coordinates.
- Existing revision-2 v3 saves receive only the complete set of new Sunward defaults. Existing required fields remain mandatory; a partial new schema is rejected. Nested Journey snapshots in Practice and Rival Circuit follow the same migration.
- The quest’s clue, recovery, return and discovery flags persist. The lens quantity must agree with recovery and return progress. Region discovery validation allows the actual known region count.
- The nine outer-route discovery fields migrate only as a complete absent group. Partially missing new groups and missing older required fields are rejected. Run identity, active battle turns, nested mode snapshots, chapter progress and storage keys are preserved.
- Terrain and directed traversal links live with the map content. Saves project the canonical landing and omit transient traversal state; refresh cannot strand the player above water or midway through a cliff.
- Main rewards, recruitment, Warden gating, homecoming, deterministic encounters, Practice isolation, Rival Circuit records and stale-tab save protection retain their existing contracts.
- Town flags migrate only when the entire new group is absent. Partial groups and out-of-order stages are rejected. Interiors require their parent region in the discovery list. Sunward and its lens chain no longer require the Wisp; the lens clue/recovery/return ordering and inventory consistency still apply.
- Content lives in `shared/rpg/adventureContent.js` and `shared/rpg/inhabitedContent.js`; progression and dialogue live in `shared/rpg/adventure.js`. Navigation uses the same gate rules as interactions. Generated world and settlement art retain source PNGs, runtime WebP derivatives and provenance manifests. No provider call or new runtime dependency is required for exploration.

## Next acts — proposed, not playable

### Act two: The Divided Signal

The restored lantern reveals that another relay is answering out of time. Mara asks for help reading the distant reply; Sela’s beacon can become a departure landmark rather than an arbitrary chapter door. The existing riverlands could host a distinct new mechanic: routing a limited signal across separated banks. That puzzle and the second chapter are not implemented by the current geographical expansion.

Before implementation, choose the exact new mechanic, author its map and NPC stakes, and prove that the player can complete it with each starter. Do not add more encounter tiers merely to stretch chapter length.

### Act three: The Lights We Keep

The proposed final act asks which places the restored network should serve first. Earlier optional assistance can appear in return dialogue and routes, while the essential ending remains available without completing every errand. The payoff is a visible network of places the player knows and people who can travel again.

Branch consequences, additional maps, chapter-transition saves and the final ending require their own content and tests. The current lens quest does not silently claim those future consequences.

## Acceptance evidence and remaining validation

The shared tests walk every existing chapter with all three starters, with and without recruitment. Sunward route tests walk its clue/recovery/return/discovery loop with each starter, save between milestones, revisit the reward giver, and rejoin the Archive. Outer-route tests walk the full seven-region loop, inspect all nine discoveries, save between landmarks and confirm unchanged chapter XP, inventory and rewards. Reachability checks cover every region’s spawn, object and destination entry. Directed-graph checks cover traversal endpoints; rejection tests cover free leaps, wrong direction, unknown links, blocked landings, overlays and reversing a one-way ledge. Compatibility checks cover old saves on new gateway tiles, active battle turns, nested mode snapshots and refresh during traversal.

Browser inspection, movement feel and responsive scene rendering belong to the integrated UI verification. Passing pure state tests does not establish enjoyment, mobile hardware performance or observed player understanding. Those need actual play sessions.
