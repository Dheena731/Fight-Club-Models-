# Valley Almanac

Implemented 2026-11-13. Later story continuation is recorded in [Stories beyond the Lantern](STORY_ARC.md). This expands the existing local Journey; it preserves the warm handheld pixel world, seven outdoor regions, ten interiors and original Lantern Signal chapter.

## Project analysis

The project has three distinct layers: React supplies accessible menus and dialogue, PixiJS renders the world, and shared deterministic rules own movement, quests, encounters and validated saves. The Express server supplies optional invite duels and the separately consented model Arena. Offline exploration makes no provider calls.

The main open-world gap was activity density. Outer regions had strong scenery, travel and lore, but few decisions or lasting goals. Adding more regions would have widened that gap. The Almanac gives the existing places distinct work, visible changes and a common homecoming.

## Playable expansion

| Place | Fieldwork | World detail |
| --- | --- | --- |
| Moss Circuit | Read the root inscription, recall a three-part growth sequence, challenge the Bramble Sentinel | Moss relay stones and a connected circuit that lights after alignment |
| Sunward Pass | Read the dawn etching and align the heliograph | Solar mirrors, ridge pennants and a restored beam toward the beacon |
| Amber Riverlands | Consult the ledger, open the northern and southern sluices, challenge the Tideglass Navigator | Gate wheels beside the bridges, a readable ledger, river fish and working gates |
| Hearthbloom Orchard | Visit the pollinator hive, collect blossom pollen and bring it home | Distinct flower beds, hives, bees, fruit and restored blooms |
| Starfall Highlands | Read the star chart, trace its constellation and challenge the Starfall Bull | A fallen-star crater, chart, fragments and an illuminated star trail |
| Forgotten Archive | Finish the existing Lantern Signal chapter and return to Mara | Existing Archive relay and town restoration count as the sixth stamp |
| Frontier Crossing | Bring all six stamps to the festival lantern | Festival bunting, a lit lantern, full team recovery and two Locker rewards |

The five fieldworks can be started in any order before the main story. Only the festival requires all six stamps. Three guardians have different three-turn intents; every starter can win at level one without consumables. Challenges remain deterministic and optional.

Open **Journal → Valley Almanac** to review stamps and field notes. **Track next step** closes the journal and follows the next landmark through open routes. The field map includes the current region's fieldwork. Undiscovered regions' current leads and guardian challenges remain trackable. The Archive entry follows the actual next chapter step.

Sequences use the clue learned at the landmark. A wrong answer resets the sequence; leaving or reloading safely restarts an unfinished puzzle. Completed steps, stamps, XP and rewards remain saved. The festival grants the **Valley Almanac** badge and **Valley Keeper** title once; equip them in the Locker.

## Implementation and compatibility

- `shared/rpg/valleyContent.js` authors projects, clues, choices and landmark positions.
- The existing reducer owns interactions, puzzles, encounters and one-time rewards. Existing navigation finds the appropriate route.
- `ValleyAlmanac.jsx` and `almanac.css` extend the field journal. The existing Pixi scene draws the new landmarks and restoration states with existing assets and geometry.
- Save version 3, map revision 2 and all browser keys are unchanged. Old saves receive the full new flag group only when it is wholly absent. Partial or impossible stage chains are rejected. Nested Journey saves, active guardian encounters and pending festival results are supported.
- Additions are passable and keep previously valid saved coordinates walkable. All new landmarks have distinct reachable positions. No dependencies or shipping raster assets were added.
- Rewards remain local and unverified; they never increase model Arena power. The valley remains a bounded authored RPG, with no claim of a seamless continent or simulated NPC schedules. Two later chapters were subsequently added in the [story continuation](STORY_ARC.md).

## Release work outside this increment

The whole-project review also identified three existing issues outside offline exploration:

- First-map loading waits for all twelve world textures, approximately 14.4 MiB. Region-specific art loading remains a performance task.
- The optional Arena's Ollama provider resolves to the server's loopback interface while the custom endpoint policy checks only custom providers. Public hosting needs an explicit policy for server-local models.
- `parseJudgeText('{}')` supplies default scores of five. Malformed judgments need an explicit scoring failure contract before treating Arena results as reliable evaluation.

Invite-duel rooms remain single-process memory. Physical phone/controller testing, long-session performance and observed player testing remain release checks.

## Verification

- All 219 project tests pass, including every level-one starter against every new guardian, independent activity ordering, reachable landmarks, dynamic chapter tracking, save migration, nested Journey saves and festival reward persistence.
- Full client lint and the final production build pass. Diff whitespace checks pass.
- Browser walkthrough exercises all five fieldworks, wrong and correct puzzle sequences, all three guardians, festival rewards, Locker entry and reload. The Archive stamp was seeded as a valid completed-chapter fixture for this walkthrough; the original chapter remains covered by existing automated tests.
- Desktop 1440px, mobile 390px and narrow 320px journal/puzzle checks show no horizontal overflow. Stamp targets are visible and at least 44px in both dimensions; actual clicks track the next landmark and completed stamps revisit the region.
- The independent finish review scored mobile action discoverability and the 320px label-spacing regression resolved. Its final ship verdict covers that fix list. Existing DESIGN.md is preserved; the already absent design sidecar was not created as a side effect.
- QA artifacts are local under .cache/qa/valley/. Reports record no browser page errors, failed requests or provider calls. Physical devices, screen readers and long-session performance were not tested.
