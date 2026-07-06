# Design

Visual system for AI Battle Arena (this repo's client). Mood: **arcade fight night** — a dark
arena stage where pixel creatures brawl, wrapped in a themeable app shell. The stage is always
dark (`.arena-dark`); the shell honors light/dark via CSS variables.

## Colors

Theme tokens live in `client/src/index.css` (`:root` dark, `[data-theme="light"]` light).

| Token | Dark | Role |
|---|---|---|
| `--c-bg` | `#0a0a0f` | App + arena background |
| `--c-card` / `--c-raised` | `#13131a` / `#0f0f16` | Panels, tiles |
| `--c-border` / `--c-border-2` | `#1e1e2e` / `#2e2e40` | Rules, tracks |
| `--c-text` (+`-2`, `-3`) | `#e8e8f0` @ 100/60/48% | Text ramp |
| `--c-accent` | `#D97757` | Brand accent (Claude coral) — CTAs, active states |

Fight palette (not themed — the stage is always dark):
- **Corner A red** `#EF4444` / **Corner B blue** `#3B82F6` — P1/P2 identity
- **Crit gold** `#FACC15` — big hits, winner stamps, judge moments
- Fighter colors: Claude `#D97757`, GPT `#10A37F`, Gemini `#4285F4`, custom `#8B5CF6`
- HP bar ramps color→yellow→red at 50%/25%; ghost lag bar is white

## Typography

- **Display / HUD:** Bebas Neue (`.font-display`), uppercase, tracked wide — names, announcer, buttons
- **Body:** Inter — dialogue, settings, descriptions
- HUD numbers tabular

## Signature components

- `PixelCreature` / `FighterSprite` — canvas pixel-art fighters with idle/attack/hurt/ko/win states
- `HPBar` — SF2-style with portrait, danger flash, white ghost lag bar
- `DamageFloat` — red damage numbers; gold + callout (SAVAGE!/BRUTAL!/…) at damage ≥ 22
- `RoundAnnouncer` — ROUND N / FIGHT! / K.O. squish overlay
- Home is a character-select screen: stage + platforms, P1/P2 roster grid, POW/WIT/SPD stat bars, INSERT COIN marquee

## Motion & sound

- Impact grammar: white hit-stop frame (~90ms) → whole-stage shake scaled by damage (7/13/22px) → HP snap + ghost drain (450ms lag)
- Ease-outs only (`[0.22, 1, 0.36, 1]`); springs for entrances
- `prefers-reduced-motion`: global CSS kills animations; shake/flash also gated in JS
- SFX are procedural WebAudio (`client/src/lib/sfx.js`): bell, punch, tick, crowd, ko — **muted by default**, 🔊 toggle persists

## Rules

- Neon/glow is voltage, not wallpaper — reserve glow for live/interactive elements and KO/winner moments
- Fighter identity = color + creature + name, never color alone
- Every battle moment should survive a screenshot (share cards are the growth engine)
