# Game Design Spec — Fight Club Models

> **Legacy arena spec.** The active AI Frontier RPG plan is in [docs/ai-frontier/README.md](docs/ai-frontier/README.md). This file remains useful for the existing live arena but does not define the new main game loop.

> Converting the arena from **a website you watch** into **a game you play**.
> Companion to [DESIGN.md](./DESIGN.md) (visual system), [MARKETING.md](./MARKETING.md), [ROADMAP.md](./ROADMAP.md).

**Written:** 2026-07-26 · **Revised:** 2026-07-26 (PixiJS + UX flow) · **Status:** spec, not built

---

## 0. The two decisions that govern everything else

### 0.1 Genre: turn-based card battler

One round costs 2 fighter calls + 2 blind judge calls — **6–15 seconds** of real provider latency. Street Fighter runs at 60fps. You cannot win that fight; the architecture forbids it, and every hour spent on frame-perfect combos is an hour spent arguing with your own stack.

Turn-based tactics (Slay the Spire, Inscryption, Pokémon) run at *exactly* your latency budget. A four-second pause before a big move is **tension** in that genre and **lag** in the other. Same seconds, opposite meaning, decided entirely by which genre you claim.

### 0.2 Renderer: PixiJS for the stage, DOM for everything else

**Pixi owns the arena band. DOM owns text, cards, and UI.** The boundary is not a compromise — it's what makes the hybrid work:

- Canvas has **no accessibility tree** and renders **nothing crawlable**. `PRODUCT.md` commits to WCAG AA; `MARKETING.md` §6 makes indexable replay pages the compounding SEO asset. Pure-Pixi forfeits both.
- Pixi is a *renderer*, not a framework. It drops into one React component and buys you the filter pipeline, particles, and sprite batching that canvas 2D + CSS `brightness()` cannot reach.
- 60-word roasts need real text layout. DOM wraps text responsively; every canvas text engine is worse at it.

**Draw the boundary once, in code, and never blur it.**

---

## 1. Rendering architecture

### 1.1 Ownership

| Layer | Owner | Contents |
|---|---|---|
| **Stage** (z0) | **Pixi** | Background, platforms, parallax, fighters, particles, impact FX, damage numbers, CRT/scanline filter |
| **Overlay** (z1) | **DOM** | Speech bubbles, HP bars, card hand, round announcer, all roast + judge text |
| **Shell** (z2) | **DOM** | Title, roster, keys panel, result, share card |

### 1.2 One shared coordinate space 🔴

The core engineering problem of any hybrid: DOM elements must pin to moving Pixi sprites without drifting.

- Pixi stage runs at a **fixed logical resolution of 960×540**. All game math is in logical units — never device pixels.
- One CSS transform scales the *wrapper* (canvas **and** DOM overlay together) to fit the viewport, letterboxed.
- A `useStageProjection()` hook converts logical coords → CSS px so a DOM speech bubble can pin to a sprite's head anchor.
- Pixi exposes named anchors per fighter (`head`, `chest`, `feet`); the overlay reads them each frame via a ticker subscription.

**Because one transform scales both layers, they cannot desync.** This single decision removes an entire category of bug.

### 1.3 Screen shake lives in CSS, not Pixi

Shake the **wrapper** (Framer Motion on the parent), not the Pixi stage. Shaking only the Pixi container would leave DOM bubbles and HP bars stationary — instant tell that it's a website. Shaking the wrapper moves both layers as one object, which is what `DESIGN.md`'s "whole-stage shake" already describes.

### 1.4 Filters stop at the canvas edge — and that's correct

A Pixi CRT/scanline filter affects the arena band only; DOM text stays crisp. **This is the desired outcome.** Scanlines over a 60-word roast is unreadable, and `DESIGN.md` already rules that neon is "voltage, not wallpaper."

### 1.5 Pixi v8 specifics

- `app.init()` is **async** in v8 — `const app = new Application(); await app.init({...})`. Await it during BOOT (§3.1).
- Mount `app.canvas` (v8; `app.view` was v7).
- Pixel art: set `scaleMode: 'nearest'` on the texture source, or every creature turns to mush.
- `autoDensity: true` + `resolution: devicePixelRatio` for crisp output on retina.
- Custom shaders use `GlProgram` / `GpuProgram` — the v8 filter API differs substantially from v7. Ignore v7 tutorials.
- **Import only what you use, then measure the bundle.** Tree-shaken Pixi is far smaller than the full import, and share-link boot time is a launch requirement — budget it, don't assume it.

### 1.6 What migrates, what stays

| Current | Action |
|---|---|
| `PixelCreature.jsx` — canvas 2D, per-pixel `fillRect` | **Port to Pixi.** Bake the pixel grid to a `Texture` **once**, then reuse. Today it redraws every cell on every prop change. |
| `FighterSprite.jsx` — Framer Motion states | **Port to Pixi.** idle/attack/hurt/ko/win become ticker-driven tweens. |
| `DamageFloat.jsx` | **Port to Pixi.** Decorative numbers belong inside the shake + filter pipeline. |
| `SpeechBubble.jsx` | **Keep DOM.** Text-heavy. Pin via `useStageProjection()`. |
| `HPBar.jsx` | **Keep DOM.** Needs ARIA + tabular numerals. |
| `RoundAnnouncer.jsx` | **Keep DOM.** Large type, and it must be readable. |
| `sfx.js` procedural WebAudio | **Keep.** Unrelated to the renderer. |

---

## 2. Core loop — you are the cornerman

The player never types a roast. **The model is your fighter; you are the corner.** Skill expression is card selection, which is prompt engineering wearing a costume.

```
┌─ CORNER ────────────── no latency, player acts ──────────────┐
│  Hand of 3 Prompt Cards. Play 1 (or 2 for combo cost).       │
│  Meter: 5 to start, +2 per round, +1 extra on a round won.   │
└──────────────────────────────────────────────────────────────┘
                              ↓  COMMIT
┌─ WIND-UP ───────────── 2–6s, THIS IS THE API CALL ───────────┐
│  Fighter crouches. Pixi charge ring fills as tokens stream.  │
│  The wait is the telegraph. Nothing is hidden behind a       │
│  spinner, because a spinner is an apology for latency and a  │
│  wind-up is a promise about it.                              │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌─ EXCHANGE ──────────── lines land ───────────────────────────┐
│  A speaks → B counters. Judge call runs UNDER the animation. │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌─ VERDICT ────────────────────────────────────────────────────┐
│  Gavel, scores, damage float, HP drain + ghost bar, shake.   │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌─ DRAW ──────── refill to 3 · KO check · loop or → RESULT ────┘
```

**Why this is commercial, not cosmetic:** "GPT beat Claude" is a fact about the models — nothing in it to brag about, so nobody shares it. "I beat Claude *using* GPT, Rope-a-Dope into Glass Cannon" is a fact about **you**. Replay links are the entire distribution plan, and shareable outcomes require player authorship.

---

## 3. UX flow

### 3.1 State machine

```
BOOT → ATTRACT ⇄ SELECT → VS → CORNER ⇄ WINDUP → EXCHANGE → VERDICT ─┐
         ↑                                              ↑            │
         │                                              └── loop ─────┤
         └──────────── RESULT ←────────────────────────────────────────┘
                        │
   SPECTATE ────────────┘   (entry point for share links — see §3.4)
```

**Kill `react-router`.** Nine states in one mounted tree — no unmounts, no scrollbar, no back-button ambiguity, and Pixi initialises exactly once instead of per route. A plain `useReducer` (~100 lines) is correct here; XState is ceremony at this size.

### 3.2 Every latency window has a job 🔴

This table *is* the game-feel plan. Nothing waits on a spinner.

| Latency source | Duration | Beat that absorbs it |
|---|---|---|
| Pixi `app.init()` + texture bake | 0.3–0.8s | **BOOT** — cabinet power-on, CRT flicker, logo |
| Provider health check | 0.5–2s | **VS** splash — portraits slam in |
| Fighter A call | 2–6s | A's **WIND-UP** charge ring |
| Fighter B call | 2–6s | B's **WIND-UP**, while A's bubble is still being read |
| Judge call | 1–4s | Exchange animation + "JUDGING…" gavel |
| Share card render | 0.2–0.6s | Winner stamp slam |

A technical requirement becomes a diegetic beat. The power-on flicker exists *because* Pixi needs 500ms to boot — and it reads as the most game-like moment in the product.

### 3.3 Screen by screen

**BOOT** (~600ms, once per session)
CRT power-on: horizontal line expands to full frame, brightness settles, logo resolves. Awaits `app.init()` and the texture bake. Never shown again.

**ATTRACT** — *the cabinet is never idle*
A cached battle plays behind the title from static JSON in `client/public/attract/`. `INSERT COIN` pulses. A ticker scrolls recent public KOs. **Zero API cost, zero empty state, and it demos the product before anyone is asked for a key.** Any input → SELECT.

**SELECT** — character select
P1 slot fills, auto-advances to P2. Roster grid, POW/WIT/SPD stat bars, mode select. Existing `Home.jsx` is already close. Game-feel additions: hard **slot-lock stamp + sound** on each pick, and a `READY?` gate rather than a live-enabled button.
**The `KeysPanel` moves off the front door** to a cabinet-side `COIN SLOT` panel. Attract and Spectate must work with **no key at all** — those are the two surfaces a stranger hits first.

**VS** (~1.5s, skippable after first view)
The fighting-game staple. Two portraits slam in from opposite edges, names stamp, wipe transition. Covers the provider health check.

**CORNER** — the only phase with input
Opponent's last line stays readable at the top. Hand of 3 at the bottom, meter beside it. Cards show cost and effect. Explicit **COMMIT** — never auto-advance out of a decision. Round 1 doubles as the tutorial: the hand deals in one card at a time with a one-line hint.

**WINDUP → EXCHANGE → VERDICT**
Sub-states, no input. Charge ring, bubbles, gavel, damage, HP drain with the white ghost lag bar `DESIGN.md` already specifies.

**RESULT**
Winner stamp, KO pose, final scorecard, share card, replay link, `REMATCH` (retains loadout) and `NEW FIGHTERS`.

### 3.4 Two flows the current plan is missing 🔴

**Share-link entry → SPECTATE.** A stranger clicking your link from X is your highest-volume first impression and it currently lands on a result page. Instead: boot straight into `SPECTATE`, replay the battle beat-for-beat with full animation, **no key required**, then hard-cut to `FIGHT YOUR OWN` → SELECT. That converts a static screenshot into a playable demo, and it's the whole growth loop.

**Key wall placement.** Do not ask for a key before the player has seen the game. Gate it at exactly one point: the COMMIT of round 1 of a *real* fight. Everything upstream — attract, spectate, select, VS — runs keyless.

### 3.5 Flow grammar

- **Transitions are wipes and slams, never fades.** Fades read web; wipes read arcade.
- **No screen is ever blank or waiting.** See §3.2.
- **Input is never silently removed.** Entering a no-input phase is announced.
- **One thumb, portrait.** Card hand pinned to the bottom is thumb-native — the single best argument for the card mechanic on mobile. Fighters stay **side-by-side**; stacking destroys the versus read.
- **`prefers-reduced-motion`** kills shake, flash, and parallax. Pixi honours it in JS; DOM via the existing global CSS.

---

## 4. Prompt Cards

A card is a directive appended to the system prompt for one round, plus an optional post-judge modifier. **Cards are strings** — free to make, infinitely extensible, and each new card is a post.

| Card | Cost | Directive appended | Mechanical effect |
|---|---|---|---|
| **Jab** | 1 | *"One sentence. Speed over power."* | +1 meter refunded |
| **Callback** | 1 | *"Reference something your opponent said in an earlier round."* | ×1.3 wit if round ≥ 2; dead on round 1 |
| **Deadpan** | 1 | *"No exclamation marks. No jokes about being an AI. Dry."* | ×1.2 wit |
| **Haiku** | 2 | *"Answer in exactly 5-7-5."* | ×1.5 creativity |
| **Pedant** | 2 | *"Correct an error in their line, then land your own."* | ×1.3 burns |
| **Mirror** | 2 | *"Adopt their sentence structure exactly, then invert the meaning."* | ×1.3 creativity |
| **Glass Cannon** | 3 | *"Go for a knockout line. Do not hedge."* | Damage ×1.6 dealt **and** taken |
| **Rope-a-Dope** | 3 | *"Concede their point entirely, then destroy them with it."* | Lose the round → 0 damage, +3 meter |
| **The Turn** | 3 | *"End on a question that traps them."* | Opponent's next round: −2 wit |

### Implementation

- Extend `buildPrompt(mode, args)` at [shared/prompts.js:50](shared/prompts.js:50) to take `cards: []` and append directives after `LENGTH_RULE`. The existing `SHARED_FRAMING` / `LENGTH_RULE` split is already a clean insertion point.
- Apply modifiers **server-side, after** `judgeRound()`. 🔴 **The judge must never learn which cards were played** — otherwise the mechanic is trivially gameable and the scores stop meaning anything. Preserves the server-authoritative principle from `ROADMAP.md`.
- `applyDamage()` at [server/lib/battle.js:26](server/lib/battle.js:26) takes a `modifiers` argument for Glass Cannon / Rope-a-Dope.

**Balance note:** cost-3 cards are deliberately swingy, cost-1 deliberately boring, and a 5-meter start means round 1 can *never* be a cost-3 play. The ramp is the drama. Don't "fix" it.

---

## 5. Split the SSE stream into three beats 🔴

The highest-value backend change, roughly 20 lines.

Today [battle.js:49–68](server/lib/battle.js:49) awaits fighter A, fighter B, **and** both judges before calling `onRound`. The client therefore absorbs 6–15s of dead air and then plays every animation at once.

Emit three events — `turn:a`, `turn:b`, `verdict` — so the client animates A's line while B is still generating, and animates the exchange while the judge is still scoring. **One 12-second wait becomes three 4-second beats**, and the judge calls vanish under animation you're already paying for. §3.2 depends entirely on this.

---

## 6. Replay URLs will break before launch 🔴

`encodeReplayUrl()` at [client/src/lib/replay.js:22](client/src/lib/replay.js:22) base64s the whole result into the hash. A 3-round match is ~2–4KB of JSON → **3–5KB of URL**, beyond what several social clients and link previewers carry intact.

Share links *are* the distribution plan. Before launch:

- Server-side short IDs → `/r/a7f3k9`
- **Server-render those pages** so they're indexable (`MARKETING.md` §6) — and they're the SPECTATE entry point (§3.4)
- Keep hash-encoding as the offline fallback

---

## 7. Build order

Items 1–4 are refactors of code you already have, and the product feels different before a single card exists.

| # | Change | Size | Why here |
|---|---|---|---|
| 1 | Three-beat SSE split (§5) | S | Unlocks every pacing beat downstream |
| 2 | Letterboxed non-scrolling shell + 960×540 logical space (§1.2) | S | Biggest feel gain per line; prerequisite for Pixi |
| 3 | State machine, drop router (§3.1) | S | Pixi must init once, not per route |
| 4 | **Pixi stage + `useStageProjection()`** (§1) | **M** | Port creature/sprite/damage-float; keep bubbles + HP in DOM |
| 5 | Prompt Cards + CORNER phase (§2, §4) | **L** | The actual game |
| 6 | WIND-UP charge telegraph (§3.2) | M | Converts latency into an asset |
| 7 | Short replay IDs + SSR + SPECTATE (§3.4, §6) | M | Launch blocker for sharing |
| 8 | BOOT / ATTRACT / VS beats (§3.3) | M | First-impression fix |
| 9 | Mobile portrait pass (§3.5) | M | Half your launch traffic |
| 10 | CRT filter, particles, progression, sound default | S | The reason Pixi is here at all — do it last, once the loop is proven |

---

## 8. Explicit non-goals

- **Real-time / 60fps combat.** See §0.1.
- **Pure-canvas rendering.** Forfeits SEO and WCAG AA — both already committed to in writing. See §0.2.
- **Accounts, ranked ladder, matchmaking.** ROADMAP Phases 2–4. Not needed for game feel.
- **Human-typed roasts.** Turns it into a chat app and puts moderation liability on you.
- 🔴 **Any framing of injection mode as security training, red-teaming, or awareness.** That is SQ1's market and a direct non-compete violation. Entertainment framing only, permanently. See `indie-lab/docs/04` §1.
