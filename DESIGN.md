# Design

> **Dual-mode design system.** The RPG's implemented title, world, dialogue, and menus use `client/src/rpg/frontier.css`; the optional arena retains the tokens below in `client/src/index.css`. The full direction is in [docs/ai-frontier/GAME_DESIGN.md](docs/ai-frontier/GAME_DESIGN.md).

## RPG visual hierarchy

The title introduces the adventure before any provider setup. The faction choice presents three original pixel silhouettes, a starting region, and a short playstyle. Each faction opens on its own region and mandate scene. In-world HUD prioritizes the active faction objective until it is complete, then The Lantern Signal. A dark ink backdrop, warm lantern gold, cool source/codex cyan, strong panel borders, and square pixel controls carry the retro feel across the world and menus. Narrative text uses a readable body face; pixel lettering is reserved for compact headings and buttons. The codex labels historical record and fictional adaptation separately.

AI Battle Arena uses a dark arcade fight-night system: a pixel stage with strong P1/P2 identity, surrounded by a restrained product shell. The arena always stays dark; the shell supports dark and light themes.

## Color system

Tokens live in `client/src/index.css`.

| Token | Dark value | Role |
|---|---:|---|
| `--c-bg` | `#0A0A0F` | App and arena background |
| `--c-card` | `#13131A` | Panels and roster tiles |
| `--c-raised` | `#0F0F16` | Inputs and nested surfaces |
| `--c-border` | `#1E1E2E` | Rules and inactive controls |
| `--c-text` | `#E8E8F0` | Primary text |
| `--c-accent` | `#FFB627` | Primary actions and selected tactics |

Amber is the product accent. Fighter colors remain identity signals: Claude coral, GPT green, Gemini blue, and custom violet. P1 red and P2 blue are corner signals, not brand colors. Red is reserved for danger, hits, and K.O. states.

## Typography

- Bebas Neue: display headlines, HUD values, round labels, and action buttons
- Inter: instructions, dialogue, provider details, and trust copy
- Wide tracking belongs to short arcade labels, not body paragraphs

## Core screens

- Home: value proposition, fighter stage, roster, match settings, and Coin Slot
- VS: a short, skippable theatrical transition that makes no provider calls
- Corner: P1 plans one prompt card per round before any paid battle call starts
- Fight: Pixi stage plus React HUD, streaming speech, impact grammar, and round log
- Result: winner moment, fight recap, rematch, and sharing

## Interaction rules

- Every primary control is at least 44 px.
- Motion communicates state: entry, wind-up, impact, verdict, and K.O.
- Hit grammar is flash, shake, HP update, then log settlement.
- Reduced-motion preferences remove nonessential animation.
- The sticky fight action must never prevent content from scrolling clear of it.
- Keys are masked, session-only by default, and paired with precise retention/cost copy.

## Signature components

- `PixelCreature` and the Pixi fighter sprites
- `HPBar`, `RoundAnnouncer`, and damage floats
- `CoinSlot` for provider commitment and preflight
- `CornerPlanner` for player agency
- `CompactRound` for readable post-verdict history
