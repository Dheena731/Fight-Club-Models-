# Design

> **Whole-game pixel design system.** The active RPG uses `client/src/rpg/journey.css`; Locker/Versus share `locker.css`. `frontier.css` preserves legacy fallback/loading surfaces. `client/src/pixel-ui.css` loads last and supplies shared pixel typography and square UI framing across the adventure and optional arena. The arena retains the tokens below in `client/src/index.css`. Current decisions: [progression plan](docs/ai-frontier/PROGRESSION_PLAN.md).

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

- Pixelify Sans is the whole-game text voice: titles, dialogue, instructions, help, status/error messages, forms, provider details and results. This explicit pixel direction replaces the previous Inter, Bebas Neue, Georgia and Courier UI typography.
- `--font-pixel-body` and `--font-pixel-display` both use the self-hosted variable font (400–700), with symbol/emoji fallbacks for existing glyphs. The unmodified font and SIL Open Font License 1.1 ship in `client/public/fonts/`; no runtime font service is needed. Sources: [Google Fonts metadata](https://raw.githubusercontent.com/google/fonts/main/ofl/pixelifysans/METADATA.pb), [license](https://raw.githubusercontent.com/google/fonts/main/ofl/pixelifysans/OFL.txt), [author repository](https://github.com/eifetx/Pixelify-Sans).
- Dialogue uses 16–18 px with generous leading; help uses 14 px and compact HUD metadata generally uses 12 px. Preserve readable copy instead of squeezing paragraphs into display lettering. Use short, lightly tracked labels; no widely tracked paragraphs.
- Native buttons, forms, dialogue frames and existing arena panels use square corners. Preserve the jade/plum/cream adventure palette, arena theme distinction, existing art, semantic controls and keyboard behavior. Pixel styling belongs to text, sprites and crisp frames, never a filter on the whole DOM.
- Responsive checks must include 320 px: title/menu fit, starter names, HUD controls, battle descriptions, save restore messages and provider forms. CSS integration or a successful build alone does not establish browser readiness.

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
