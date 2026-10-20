# Game and content design

## Player promise and modes

The player begins in a frontier settlement and follows signals left by earlier research guilds. Exploring reveals clues, characters, shortcuts, and useful items. Choices change which leads and relationships become available. The world remains playable with no API key.

| Mode | Player action | Outcome source | Credential needed | Initial scope |
| --- | --- | --- | --- | --- |
| Story exploration | Move, investigate, talk, solve, collect | Versioned quest/world rules | No | First release |
| Tactical RPG combat | Choose ability, manage energy, respond to an enemy tell | Local deterministic combat rules | No | First chapter |
| Live model arena | Select models and challenge, authorize calls, inspect outputs | Actual provider responses plus stated scoring | Yes, unless a supported local model is available | Preserve existing arena; improve in Phase 4 |
| Cooperative exploration | Share location and eligible quest events | Server-authoritative room state | Session, never another player's API key | Phase 5 |
| Competitive AI challenge | Two authorized participants submit to the same versioned challenge | Server-verified result | Each owner explicitly authorizes calls | Phase 5, after fair scoring |

The existing Roast, Prompt Injection, and Impersonation matches remain **arena entertainment modes**. Their current model-judge scores are subjective and cannot be called objective model rankings. Phase 4 adds separately named, versioned objective tasks before competitive claims.

## First playable chapter: The Lantern Signal

This is an original fictional story, not a claim about a real company.

1. **Frontier Crossing:** Learn movement, interaction, journal, map, and the distinction between game combat and live AI challenges. A guide points to a dark relay lantern.
2. **Moss Circuit:** Explore an overgrown path, follow an environmental clue, recover a signal shard, and meet an NPC who hints at hostile static.
3. **Forgotten Archive:** Read a short lore fragment, solve a two-state relay puzzle, and face one tactical encounter. Return to the guide to light the lantern and unlock a route for a later chapter.

Required loop: explore → discover clue → accept objective → use map/journal → solve or fight → receive reward → return → world visibly changes → save and resume. An initial playtest target is 15–25 minutes; this is not a measured duration.

Quest data needs an id, version, giver, objective text, completion predicates, prerequisites, rewards, follow-up, and dialogue references. A quest uses at least two verbs besides walking. Rewards change play through a route, ability, equipment, or meaningful story information.

## Factions, models, and history

The fictional Research Guild, Wardens, and Observatory can evoke different approaches to AI without reproducing real corporate branding. Phase 2 maps them to supported provider metadata and explains the inspiration. Each gets an introductory scene, visual silhouette, quest branch, ally, and playstyle. Model characters have original portraits, animations, and game-balanced abilities. Technical capability descriptions stay separate from invented combat stats and are checked against provider documentation before publication.

Do not invent real incidents. Historical entries use `{eventId, occurredAt, organizationIds, factualSummary, sourceUrls, checkedAt}`. Fictional quest content references an `eventId` but lives in a separate record with an explicit “Inspired by” presentation. Disputed claims need qualifying language and credible sources or are excluded.

## Game states and combat

Use a finite state machine: `TITLE → EXPLORE ↔ DIALOGUE / JOURNAL / MAP / INVENTORY → RPG_COMBAT → EXPLORE`, with `EXPLORE → ARENA → EXPLORE` as a separate branch. Pause movement whenever a modal game state owns input. Escape/Back closes the top layer before leaving the region. No player action is silently lost during a transition.

Initial RPG combat: player HP, energy, three distinct abilities (free basic, energy-heavy attack, defensive response), one readable enemy intent, and a win/lose recovery path. Define balancing values in data. Resolve combat with a pure function and a seed or recorded action sequence so tests and replays can reproduce outcomes. A loss returns to a checkpoint without erasing completed quests. Save after rewards and region transitions, not during a half-applied turn.

The live arena has a different ruleset. Real outputs must never be fabricated by offline combat. A failed or interrupted provider call is shown as incomplete, with no fabricated win.

## Screen flow

| Screen | Main question answered | Primary action |
| --- | --- | --- |
| Title | What kind of game is this, and can I continue? | Continue / New game |
| Faction start (Phase 2) | Who am I and what changes with this choice? | Choose an identity |
| World | Where am I, what can I do, where is my objective? | Move / Interact |
| Dialogue | Who is speaking and what does this choice do? | Choose / Continue |
| Journal and map | What have I discovered, and where can I go? | Track / Close |
| RPG combat | What is the enemy about to do and what can I afford? | Choose ability |
| Arena entrance | Is this a fictional fight or a real provider call? | Practice or connect provider |
| Live result | What did each model say and how was it scored? | Inspect / Return to world |

## Visual and audio direction

Pixel art is the common language across world, combat, roster, menus, and results. Use a consistent logical pixel grid, limited palette per region, clear silhouettes, and reusable animation states. Aim for a 16-bit inspired world with modern depth through light, shadow, weather, and foreground layers. All art and sound must be original or appropriately licensed; record source/license beside each asset.

- **Frontier:** ink blue night, lantern amber, weathered timber, lively signage and warm windows.
- **Moss Circuit:** deep teal, desaturated mint, wet stone, low fog, bright signal shards.
- **Archive:** violet shadows, oxidized brass, pale cyan relay light, tall broken shelves.
- **Arena:** keep P1/P2 corner colors; bring its surfaces into the same pixel UI system.

Use pixel display lettering for brief headings and numbers. Dialogue, menus, settings, and errors use readable body type. Scale the scene independently from touch targets and text. Keep core controls at least 44 CSS px, offer on-screen movement/interact controls on touch devices, and test narrow widths. Respect reduced motion for flashes and shakes. Audio starts only after user action, with separate music and effects controls.

## Product validation before expansion

Observe players completing the first chapter without guidance. Note where they get lost, whether they understand objective and combat, whether they return to explore, and whether they distinguish the live arena from offline play. Track events without prompts or API keys: game start, tutorial completion, quest accepted/completed, combat started/completed, arena opened, provider consent, and voluntary return. Use evidence before increasing world size or setting prices.
