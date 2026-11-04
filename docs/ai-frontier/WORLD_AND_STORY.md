# Cogimon — world and story

Current playable chapter and expansion direction · 2026-11-05

## The promise

A human trainer and an original companion restore the small lights that let people find their way home. The main story gives the journey a destination. Optional roads let the player decide whose troubles to hear, which places to remember, and when to come back. Exploration, clues and character stakes stay deterministic and playable without an account or provider calls.

This is a connected, authored chapter with an optional region. A continent, a second chapter, autonomous NPCs and multiplayer are not implemented. Large empty fields do not count as more adventure.

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

## People worth returning to

- **Mara, the Keeper:** holds the town’s promise while the player works beyond its walls. Homecoming resolves her immediate need.
- **Ivo, the Scout:** teaches preparation through readable enemy intent and introduces Mossback after the Wisp. His route advice connects the optional pass to the existing world.
- **Neri, the Scholar:** turns a remembered record into the relay solution. The notes matter in exploration and combat.
- **Sela, the Routekeeper:** tends a smaller beacon above the crossing. Recovering her missing lens helps someone whose task will continue after the player leaves.
- **The chosen companion:** Emberquill protects, Kitewhisk finds openings, and Duplet remembers. Starter identities affect the available commands; all can complete the chapter. Mossback joins through an explicit local story action.

These are authored interactions. Persistent companion relationships, branching companion endings and simulated daily schedules are future work.

## Sunward Pass: an optional loop — implemented

The eastern trailhead in Moss Circuit opens after the Static Wisp is cleared. The pass is 36 × 24 tiles: a western arrival, an orchard switchback, a northern ridge, an old lookout, a southern memorial road and a quiet overlook. Rock terraces and tree banks separate the routes. The roads reconnect at the eastern ridge; no quest requires a menu teleport.

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
4. Walk back to Sela. Returning the lens grants **two Field Tonics and one Signal Tea once**, bounded by the existing 99-item cap. The returned quest item leaves the pack.

The quest grants no extra chapter XP or invented cosmetic reward. Its supplies can help with the existing Archive journey. Sela’s follow-up invites a visit to the southern memorial road. Reading Lantern Overlook records a separate, persistent discovery; it can also be found before returning the lens.

The HUD, journal integration and field map use a separate optional objective. The field map reveals terrain after a first visit, shows landmarks and keeps the main route understandable. Lantern Overlook remains visible and interactable in the world, but its map marker and coordinates appear only after discovery. The map then records it by name.

## Content and save contracts

- The three existing region layouts, existing object and exit coordinates, and map revision remain unchanged. Moss Circuit gains one passable trailhead, preserving an old save that occupies its tile.
- Existing revision-2 v3 saves receive only the complete set of new Sunward defaults. Existing required fields remain mandatory; a partial new schema is rejected. Nested Journey snapshots in Practice and Rival Circuit follow the same migration.
- The quest’s clue, recovery, return and discovery flags persist. The lens quantity must agree with recovery and return progress. Region discovery validation allows the actual known region count.
- Main rewards, recruitment, Warden gating, homecoming, deterministic encounters, Practice isolation, Rival Circuit records and stale-tab save protection retain their existing contracts.
- Content lives in `shared/rpg/adventureContent.js`; progression and dialogue live in `shared/rpg/adventure.js`. No provider service, downloaded asset or new dependency is involved.

## Next acts — proposed, not playable

### Act two: The Divided Signal

The restored lantern reveals that another relay is answering out of time. Mara asks for help reading the distant reply; Sela’s beacon can become a departure landmark rather than an arbitrary chapter door. A proposed river route introduces one distinct exploration mechanic: routing a limited signal across separated banks. A direct main road reaches the relay; an optional floodplain route explains whom the broken timing affects.

Before implementation, choose the exact new mechanic, author its map and NPC stakes, and prove that the player can complete it with each starter. Do not add more encounter tiers merely to stretch chapter length.

### Act three: The Lights We Keep

The proposed final act asks which places the restored network should serve first. Earlier optional assistance can appear in return dialogue and routes, while the essential ending remains available without completing every errand. The payoff is a visible network of places the player knows and people who can travel again.

Branch consequences, additional maps, chapter-transition saves and the final ending require their own content and tests. The current lens quest does not silently claim those future consequences.

## Acceptance evidence and remaining validation

The shared tests walk every existing chapter with all three starters, with and without recruitment. New route tests walk the Sunward clue/recovery/return/discovery loop with each starter, save between milestones, revisit the reward giver, and rejoin the Archive. Reachability checks cover every region’s spawn, object and destination entry. Compatibility checks cover an old save on the new trailhead tile, active battle turns and nested mode snapshots.

Browser inspection, movement feel and responsive scene rendering belong to the integrated UI verification. Passing pure state tests does not establish enjoyment, mobile hardware performance or observed player understanding. Those need actual play sessions.
