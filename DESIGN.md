# Design

> **GBA companion design system.** The active RPG uses `client/src/rpg/journey.css`; Locker/Versus share `locker.css`. `frontier.css` preserves legacy fallback/loading surfaces. The optional arena retains the tokens below in `client/src/index.css`. Current decisions: [progression plan](docs/ai-frontier/PROGRESSION_PLAN.md).

## RPG visual hierarchy

Cogimon uses a cream wordmark with a plum outline and an amber pixel spark with two eyes (`client/public/cogimon-icon.svg`) as its favicon and menu mark. The optional model destination is branded Cogimon Arena. The chapter remains The Lantern Signal, and original companion names remain unchanged.

Cogimon is the product brand: an AI creature companion adventure in a warm GBA visual world. **The Lantern Signal** names the first chapter. Use Cogimon on product surfaces and Cogimon Arena for the optional live-model destination; keep existing `ai-frontier:` and `aba:` browser keys stable for save/preference compatibility and credential cleanup.

The panoramic title introduces a sunlit world before any provider setup. Starter choice uses expressive original avatars, clear roles and unrestricted inspection. Exploration is Pixi-rendered; native dialogue/menu controls remain readable and keyboard accessible. Daylight jade/leaf/ochre terrain, terracotta architecture and plum outlines carry the GBA direction. Cloud panels (`#F4F6ED`), plum ink (`#2B2438`), jade actions (`#35654F`) and restrained gold selection/rewards remain consistent across setup, exploration, dedicated combat, results and Locker. Adventure level is labelled prestige in the arena; local badges never imply verified public achievements.

Cogimon Arena uses a dark arcade fight-night system: a pixel stage with strong P1/P2 identity, surrounded by a restrained product shell. The arena always stays dark; the shell supports dark and light themes.

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
