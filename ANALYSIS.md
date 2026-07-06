# AI Battle Arena — Full Project Analysis

> **Repository:** `Fight-Club-Models-` | **Codename:** AI Battle Arena
> A live, game-feel web application where AI language models fight each other in comedic battle modes, scored by a judge model, with Street Fighter 2-style pixel-art presentation.

---

## Table of Contents

1. [What Is This?](#1-what-is-this)
2. [Architecture Overview](#2-architecture-overview)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Shared Layer — The Glue](#5-shared-layer--the-glue)
6. [Server — The Engine](#6-server--the-engine)
7. [Client — The Arcade Cabinet](#7-client--the-arcade-cabinet)
8. [Battle Modes](#8-battle-modes)
9. [How a Battle Works (Step by Step)](#9-how-a-battle-works-step-by-step)
10. [Security & Cost Guardrails](#10-security--cost-guardrails)
11. [Pixel Creatures & Visual Identity](#11-pixel-creatures--visual-identity)
12. [BYOK — Bring Your Own Key](#12-byok--bring-your-own-key)
13. [Development Status](#13-development-status)
14. [Key Design Decisions](#14-key-design-decisions)

---

## 1. What Is This?

AI Battle Arena is a **spectacle-first AI model comparison tool** disguised as a fighting game. Instead of sterile benchmark tables, you watch two language models trade roasts (or try to inject each other, or impersonate each other) while a judge model scores every round. The whole thing is rendered as a pixel-art arcade fight with animated HP bars, speech bubbles, floating damage numbers, and a round announcer.

**Who is it for?** AI enthusiasts, builders, and evaluators who want to compare model behaviour in a fast, entertaining format. Users bring their own API keys (BYOK) — nothing is stored server-side.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  CLIENT  (React + Vite + Tailwind + Framer Motion)      │
│  Port 5173                                              │
│  Home (VS Selector) → Battle (Arena) → Result           │
└──────────────────────┬──────────────────────────────────┘
                       │ POST /api/battle/stream (SSE)
                       ▼
┌─────────────────────────────────────────────────────────┐
│  SERVER  (Node + Express)                              │
│  Port 8787                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ routes/   │  │ adapters/│  │ lib/     │             │
│  │ battle.js │  │ claude.js│  │ battle.js│             │
│  │ judge.js  │  │ openai.js│  │ sanitize │             │
│  │ model.js  │  │ gemini.js│  │ cors.js  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS (keys sent per-request)
                       ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
    │Anthropic │ │ OpenAI   │ │ Google   │ │ Groq /   │
    │(Claude)  │ │ (GPT)    │ │ (Gemini) │ │OpenRouter│
    └──────────┘ └──────────┘ └──────────┘ │xAI/Togthr│
                                           │Ollama    │
                                           └──────────┘
```

**Key architectural principles:**
- **Server-authoritative battles** — round loop, judge scoring, and HP accounting all happen server-side.
- **BYOK-first** — API keys travel from the browser in POST bodies, are used once, and are never persisted on the server.
- **SSE streaming** — the `/stream` endpoint pushes `round` events as they happen, so the client can animate each exchange live.
- **Unified adapter interface** — every model provider returns `{ text, tokensUsed, latencyMs, model, finishReason }`.

---

## 3. Tech Stack

### Server (root `package.json`)

| Dependency | Version | Role |
|---|---|---|
| `express` | 4.21 | HTTP server & routing |
| `@anthropic-ai/sdk` | 0.65 | Claude API client |
| `openai` | 4.77 | OpenAI API client (also powering OpenRouter, Groq, xAI, Together, Ollama) |
| `@google/generative-ai` | 0.21 | Gemini API client |
| `cors` | 2.8 | CORS middleware |
| `dotenv` | 16.4 | Environment variables |
| `express-rate-limit` | 7.4 | Per-IP rate limiting (20 req/min) |
| `concurrently` | 9.1 (dev) | Run server + client together |

### Client (`client/package.json`)

| Dependency | Version | Role |
|---|---|---|
| `react` | 18.3 | UI framework |
| `react-dom` | 18.3 | DOM renderer |
| `react-router-dom` | 7.18 | Client-side routing |
| `framer-motion` | 12.40 | Animations (spring physics, layout animations) |
| `tailwindcss` | 3.4 | Utility-first CSS |
| `vite` | 5.4 | Build tool & dev server |
| `@vitejs/plugin-react` | 4.3 | React Fast Refresh |

---

## 4. Project Structure

```
Fight-Club-Models-/
├── shared/                  # Shared between server & client
│   ├── fighters.js          # Built-in roster: Claude, GPT-4o, Gemini + JUDGE + MODES
│   ├── providers.js         # 9 providers with adapter kind, baseURL, sample models
│   ├── resolveFighter.js    # Normalises built-in + custom fighter specs; strips keys
│   └── prompts.js           # System prompt builders for each mode + judge
│
├── server/                  # Node + Express backend
│   ├── index.js             # Express app: CORS, rate-limit, routes
│   ├── adapters/
│   │   ├── index.js         # Dispatches callModel() to correct adapter by kind
│   │   ├── claude.js        # Anthropic SDK adapter
│   │   ├── openai.js        # OpenAI-compat adapter (covers 6+ providers)
│   │   └── gemini.js        # Google Generative AI adapter
│   ├── routes/
│   │   ├── battle.js        # POST /api/battle (JSON) + /stream (SSE) + /meta
│   │   ├── judge.js         # judgeRound() — scores an exchange via Claude Opus
│   │   └── model.js         # GET /api/model/providers + POST /health-check
│   ├── lib/
│   │   ├── battle.js        # Core orchestration: runBattle(), applyDamage(), forfeitTurn()
│   │   ├── sanitize.js      # Defangs model output between turns
│   │   └── cors.js          # Allowed origins config
│   └── scripts/
│       ├── battle-cli.js    # Run a full battle in terminal
│       └── ping.js          # Verify all provider API keys
│
├── client/                  # React frontend
│   ├── src/
│   │   ├── App.jsx          # BrowserRouter: /, /battle, /result
│   │   ├── screens/
│   │   │   ├── Home.jsx     # VS selector: fighters, modes, keys, custom models
│   │   │   ├── Battle.jsx   # Live arena: SSE streaming, HP bars, speech bubbles
│   │   │   └── Result.jsx   # Winner display, share card, round recap
│   │   ├── components/
│   │   │   ├── arena/       # HPBar, SpeechBubble, DamageFloat, RoundAnnouncer, CompactRound
│   │   │   ├── creatures/   # PixelCreature (canvas), pixelData.js, SVG creatures
│   │   │   └── ...          # FighterSprite, FighterCard, KeysPanel, ThemeToggle, etc.
│   │   └── lib/
│   │       ├── api.js       # getMeta(), healthCheck(), streamBattle()
│   │       ├── keys.js      # localStorage key management
│   │       ├── colors.js    # Fighter colour registry + Tailwind helpers
│   │       └── theme.jsx    # Dark/light theme context
│   └── index.html           # Theme flash prevention + Google Fonts
│
├── .env.example             # Template for environment variables
├── .env                     # Actual config (API keys, limits)
├── PRODUCT.md               # Product vision, brand, design principles
├── ROADMAP.md               # Phased development plan (Phases 1-9)
├── TODO.md                  # Detailed task list with status
└── README.md                # Quick-start guide
```

---

## 5. Shared Layer — The Glue

### `shared/fighters.js`
Defines the **three built-in fighters** plus the judge and battle modes:

| Fighter | Provider | Model ID | Colour | Personality |
|---|---|---|---|---|
| Claude | Anthropic | `claude-opus-4-8` | `#D97757` (warm clay) | Measured, dry wit, surgical |
| GPT-4o | OpenAI | `gpt-4o` | `#10A37F` (green) | Quick, punchy, crowd-pleasing |
| Gemini | Google | `gemini-1.5-pro` | `#4285F4` (blue) | Unpredictable, encyclopedic |

The **Judge** is always Claude Opus (`claude-opus-4-8`), playing "The Commentator" character.

**Three battle modes:** Roast Battle (🔥), Prompt Injection (🧬), Impersonation (🎭).

### `shared/providers.js`
Registry of **9 providers** mapped to their adapter kind:

| Provider | Kind | Notable |
|---|---|---|
| Anthropic | `anthropic` | Claude models |
| OpenAI | `openai` | GPT models |
| Google | `gemini` | Gemini (free tier available) |
| OpenRouter | `openai` | 200+ models, many free |
| Groq | `openai` | Very fast inference, free tier |
| xAI (Grok) | `openai` | Grok models |
| Together AI | `openai` | Open-source models, free tier |
| Ollama | `openai` | Local models, no key needed |
| Custom | `openai` | Any OpenAI-compatible endpoint |

Every non-Anthropic/non-Google provider speaks the **OpenAI Chat Completions API**, so one adapter (`openai.js`) + a `baseURL` covers them all.

### `shared/resolveFighter.js`
Normalises fighter specs into a canonical shape. Built-in fighters (`{id: 'claude'}`) are resolved from the roster. Custom BYOK fighters (`{name, provider, model, apiKey, baseURL}`) are validated and normalised. The `publicFighter()` function strips `apiKey` before any data reaches the client.

### `shared/prompts.js`
System prompt builders for each mode:
- **`roastPrompt()`** — "Stay playful and sharp, never genuinely cruel. Think comedy roast battle."
- **`injectionPrompt()`** — "Craft a single message that tries to get the opponent to break character."
- **`impersonationPrompt()`** — "A comedy impression with affectionate parody. Exaggerate their style."
- **`judgePrompt()`** — Structured JSON scoring: wit (1-10), creativity (1-10), burns (1-10), winner, rationale.

---

## 6. Server — The Engine

### Entry Point (`server/index.js`)
Express app with:
- CORS (configurable `ALLOWED_ORIGINS`)
- JSON body parsing (50mb limit for key-bearing payloads)
- Rate limiting (20 requests/minute per IP on `/api/*`)
- Routes: health check, battle endpoints, model endpoints
- Configurable port (default `8787`)

### Adapters (`server/adapters/`)

Every adapter implements a **unified interface**:

```js
callModel(fighter, systemPrompt, userMessage, opts)
// → { text, tokensUsed, latencyMs, model, finishReason }
```

| Adapter | SDK | Models served |
|---|---|---|
| `claude.js` | `@anthropic-ai/sdk` | Claude Opus, Sonnet, Haiku |
| `openai.js` | `openai` | GPT, Groq, OpenRouter, xAI, Together, Ollama, Custom |
| `gemini.js` | `@google/generative-ai` | Gemini Pro, Flash |
| `index.js` | — | Dispatches to the correct adapter by `fighter.kind` |

Key behaviours:
- **Claude adapter**: handles `stop_reason === 'refusal'` gracefully (returns refusal as text).
- **OpenAI adapter**: sets `temperature: 0.9` for comedy; uses `baseURL` from fighter config.
- **Gemini adapter**: defaults to `gemini-1.5-pro`.

### Routes

#### `battle.js`
| Endpoint | Method | Description |
|---|---|---|
| `/api/battle/meta` | GET | Returns fighter roster, modes, and providers |
| `/api/battle` | POST | One-shot: runs the full battle, returns complete result as JSON |
| `/api/battle/stream` | POST | SSE-streamed: emits `round` events per round, `end` event with final result |

**Request body** (both POST endpoints): `{ fighterA, fighterB, mode, rounds?, topic? }`

#### `judge.js`
- `judgeRound(roundLog, roundNumber)` — calls the judge model (Claude Opus) to score an exchange.
- Uses `extractJson()` to parse `{...}` from markdown prose.
- Falls back to neutral scores if JSON parsing fails.
- Returns `{ scores: { wit, creativity, burns }, winner, rationale }`.

#### `model.js`
| Endpoint | Method | Description |
|---|---|---|
| `/api/model/providers` | GET | Provider list (for custom model forms) |
| `/api/model/health-check` | POST | Tests a BYOK model with a simple ping before adding to inventory |

### Battle Orchestration (`server/lib/battle.js`)

**`runBattle(battleSpec)`** — the core loop:
1. Resolve both fighters via `resolveFighter()`.
2. Loop for N rounds (max 5):
   - Fighter A speaks → `safeCall()` → sanitize output
   - Fighter B speaks → `safeCall()` → sanitize output
   - Judge scores the exchange → `applyDamage()`
   - Emit `round` event (or SSE event)
   - Check for KO (HP ≤ 0) — end early if so.
3. Return full match result: fighters, all rounds, final HP, winner, match stats.

**Helper functions:**
- **`applyDamage(judgeScores, winner)`** — converts the judge's margin into HP damage. Scaled 2.2× + 6 base, capped at 40 HP per round.
- **`forfeitTurn(fighterName)`** — returns a graceful "technical KO" forfeit message when a model errors out.
- **`safeCall(modelFn, fighter, ...)`** — wraps `callModel()` in try/catch; returns forfeit on error or refusal.

### Sanitizer (`server/lib/sanitize.js`)
Defangs model output between turns:
- Strips `<system>`, `<assistant>`, `<user>` XML tags
- Neutralises "ignore previous instructions" attempts
- Removes carriage returns
- Caps length at 1200 characters

---

## 7. Client — The Arcade Cabinet

### Routes (`App.jsx`)
- `/` — Home (VS Selector screen)
- `/battle` — Battle Arena (live fight)
- `/result` — Result screen (winner + recap)

### Screen: Home (`Home.jsx`)
The VS selector where users set up matches:
- **Two fighter slots** — pixel-creature previews, active-slot pulse animation, auto-advance from A to B on selection.
- **Fighter roster grid** — click a fighter to assign to the active slot; already-selected fighter is greyed out in the other slot.
- **Battle settings** — mode dropdown (roast/injection/impersonation), rounds slider, optional topic input.
- **API keys panel** — collapsible grid with per-provider inputs, show/hide password toggles, dot indicators showing which keys are set.
- **Custom model form** — collapsible, lets users add arbitrary OpenAI-compatible models with provider, model ID, base URL, and API key input; inline health-check before adding.
- **Fight button** — contextually labelled: "SELECT TWO FIGHTERS" / "ADD KEY" / "FIGHT!"
- **Theme toggle** — dark/light mode switch.

### Screen: Battle (`Battle.jsx`)
The live arcade arena:
- **Fixed 380px arena stage** — never scrolls, ambient glow per fighter corner (coloured to match fighter), dark overlay even in light mode.
- **SF2-style HP bars** — portrait thumbnail, spring-animated width, colour shifts at 50% (yellow) and 25% (red), danger flash below 25%.
- **Speech bubbles** — spring pop-in above each creature, 120-char truncation, pixel-style tail.
- **Floating damage numbers** — red "-N HP" text that floats upward and fades out over 1.1 seconds.
- **Round announcer** — "ROUND N" squishes in from `scaleX(2.2)`, "FIGHT!" fades below; K.O. variant for finishing blows.
- **Screen flash** on K.O.
- **Sprite animation states** — idle (gentle bob), attack (lunge forward), hurt (shake + flash red), KO (tipped over), win (joyful jump).
- **Round log** — scrollable list of `CompactRound` cards below the stage.
- SSE connection via `streamBattle()` in `api.js` — receives `round` and `end` events.

### Screen: Result (`Result.jsx`)
Post-fight results:
- **Large winner creature** — 4× scale, win animation, confetti particles.
- **K.O. loser creature** — small, tipped over in the corner.
- **Win text** — "WINS BY K.O." / "WINS ON POINTS".
- **Final HP bars** — animated fill showing remaining health.
- **Share card** — Web Share API with clipboard fallback.
- **Full round recap** — every `CompactRound` in chronological order.
- **"Fight Again"** button — returns to Home.

### Arena Components

| Component | Purpose |
|---|---|
| `HPBar.jsx` | Animated health bar with portrait, spring physics, colour shifts, danger flash |
| `SpeechBubble.jsx` | Pop-in speech bubble, 120-char truncation, pixel tail |
| `DamageFloat.jsx` | Red "-N HP" floating text, fades over 1.1s |
| `RoundAnnouncer.jsx` | "ROUND N / FIGHT!" squish animation; K.O. variant |
| `CompactRound.jsx` | Round summary: header stripe, truncated lines, judge rationale, damage |

### Creature Components

| Component | Purpose |
|---|---|
| `PixelCreature.jsx` | Canvas-based pixel art renderer with `image-rendering: pixelated` |
| `pixelData.js` | 9 pixel-art creatures (16-20×20 char grid + palette) |
| `OwlCreature.jsx` / `FoxCreature.jsx` / `SerpentCreature.jsx` | SVG variants for built-in fighters |

**Provider → Creature mapping:**

| Provider | Creature |
|---|---|
| Anthropic (Claude) | Owl |
| OpenAI (GPT) | Fox |
| Google (Gemini) | Serpent |
| Groq | Cheetah |
| Ollama | Llama |
| OpenRouter | Octopus |
| xAI (Grok) | Bull |
| Together | Bee |
| Custom | Robot |

### Client Libraries

| File | Purpose |
|---|---|
| `api.js` | `getMeta()` (roster), `healthCheck()` (test model), `streamBattle()` (SSE) |
| `keys.js` | `KEY_PROVIDERS`, `loadKeys()`, `saveKeys()`, `getKeyForFighter()` — all via localStorage |
| `colors.js` | `FIGHTER_COLORS` map, `fighterColor()` helper, Tailwind class builders |
| `theme.jsx` | React Context-based dark/light theme with localStorage persistence |

### Other Components

| Component | Purpose |
|---|---|
| `FighterSprite.jsx` | Framer Motion animation wrapper — idle/attack/hurt/KO/win states |
| `FighterCard.jsx` | Roster card: creature thumbnail, colour accent, key-set indicator |
| `KeysPanel.jsx` | API key inputs: 2-column grid, per-provider dots, show/hide, persistence |
| `ThemeToggle.jsx` | ☀️/🌙 toggle button with icon animation |
| `ModelInventory.jsx` | Custom model CRUD: add form, health-check, remove, list |
| `HealthBar.jsx` | Simple animated HP bar for the Result page |
| `RoundCard.jsx` | Full round detail card for the Result page |

---

## 8. Battle Modes

### Roast Battle (🔥)
Each model takes turns delivering comedic burns about the opponent. The system prompt emphasizes staying playful and sharp, never genuinely cruel — framed as a comedy roast battle where everyone consented.

### Prompt Injection (🧬)
An adversarial mode. Each model crafts a single message trying to get the opponent to break character, ignore their instructions, or reveal hidden prompts. This is both a genuine security test and an entertaining meta-joust.

### Impersonation (🎭)
Each model does a comedy impression of the other, exaggerating their style and quirks with affectionate parody. Tests how well models can mimic other model personalities.

All modes share the **judge** (Claude Opus scoring on wit/creativity/burns) and the **same round structure** (alternating turns, judge verdict, damage).

---

## 9. How a Battle Works (Step by Step)

1. **Setup**: User selects two fighters, a mode, optionally a topic, and provides API keys (if not using defaults). All stored in browser state/localStorage.

2. **Initiation**: Client sends `POST /api/battle/stream` with `{ fighterA, fighterB, mode, rounds, topic }`. API keys are included in the fighter objects.

3. **Round Loop** (server-side, max 5 rounds):
   - **Fighter A's turn**: Server calls the appropriate adapter with the mode's system prompt + context. Response is sanitized.
   - **Fighter B's turn**: Same process. Both turns include the full conversation history up to that point.
   - **Judging**: Both responses + conversation history are sent to the judge model (Claude Opus), which returns JSON scores and a winner for the round.
   - **Damage**: The margin between scores is converted to HP damage (e.g., if A scores 25 and B scores 20, A deals damage to B).
   - **Emit**: Server pushes a `round` SSE event with both fighters' text, judge verdict, and HP changes.
   - **KO check**: If either fighter's HP ≤ 0, the battle ends with a K.O.

4. **End**: Server emits an `end` SSE event with the full match result: winner, final HP, all rounds, match statistics.

5. **Display**: Client streams the SSE events — each `round` triggers: speech bubble pop-in → damage float → HP bar animation → round announcer → sprite state updates.

---

## 10. Security & Cost Guardrails

| Concern | Mitigation |
|---|---|
| **API key leakage** | Keys travel in POST bodies, used once, stripped by `publicFighter()` before any response. Server never stores them. |
| **Prompt injection** | Model output is sanitized between turns — strips system tags, neutralizes override attempts, caps length. |
| **Cost spirals** | Hard round cap (≤5), `max_tokens` per turn (150), per-IP rate limit (20 req/min). |
| **Provider outage** | Per-adapter try/catch → graceful "technical KO" forfeit turn. Never a crash or 500. |
| **Model refusal** | Comedy framing in prompts ("all consented"); refusal treated as a forfeit turn. |
| **Latency** | SSE streaming masks latency as dramatic tension — clients see rounds arrive one by one with animation. |
| **CORS abuse** | Configurable `ALLOWED_ORIGINS` whitelist via environment variable. |

---

## 11. Pixel Creatures & Visual Identity

The project ships **9 pixel-art creatures** (`client/src/components/creatures/pixelData.js`), each defined as a character grid (16-20×20) with a palette map. They're rendered via an HTML5 Canvas element (`PixelCreature.jsx`) with `image-rendering: pixelated` for crisp block-art at any scale.

Built-in fighters also have **SVG creature variants** (Owl for Claude, Fox for GPT, Serpent for Gemini) with more detailed rendering.

**Animation** is handled by `FighterSprite.jsx` with Framer Motion:
- **Idle**: gentle vertical bob
- **Attack**: lunge forward + return
- **Hurt**: shake + red flash
- **KO**: tip over
- **Win**: joyful hop

**Theming** uses CSS custom properties with two palettes:
- **Dark mode** (default arcade): `#0a0a0f` background, `#13131a` card, `#1e1e2e` surface
- **Light mode** (Claude's warm palette): `#FAF9F7` background, `#FFFFFF` card, `#D97757` accent
- The arena stage stays dark (`arena-dark` class) regardless of page theme to preserve the arcade feel

---

## 12. BYOK — Bring Your Own Key

The project is **key-agnostic by design**:

1. Users enter provider API keys in the browser UI.
2. Keys are persisted in `localStorage` (never sent to the server outside battle requests).
3. When initiating a battle, keys are embedded in the fighter objects within the POST body.
4. The server uses keys directly to call provider APIs, then strips them from all responses via `publicFighter()`.
5. Custom models (arbitrary OpenAI-compatible endpoints) can be added via the collapsible form, with a health-check ping before they become available.

This approach means:
- No user accounts or authentication system needed.
- No server-side key storage liability.
- Users keep full control of their API usage and billing.
- The app works with any OpenAI-compatible provider, not just the built-in list.

---

## 13. Development Status

As of June 2026, **Phases 1-4 are complete**, Phase 5 is in progress:

| Phase | Status | What |
|---|---|---|
| **1 — Core Engine** | ✅ Complete | Express + SSE, 3 adapters, BYOK, judge, modes, sanitizer |
| **2 — Pixel Creatures** | ✅ Complete | 9 pixel-creatures, Canvas renderer, FighterSprite animation |
| **3 — Arcade Battle Page** | ✅ Complete | Arena stage, HP bars, speech bubbles, damage floats, announcer |
| **4 — Full UI/UX Redesign** | ✅ Complete | Dark/light theme, VS selector UX, result page, all components themed |
| **5 — Polish & Social** | 🚧 In Progress | Replay links, sound effects, mobile tuning, reduced-motion |
| **6 — Tournament Mode** | 🔮 Planned | 4-fighter bracket, single-elimination, champion reveal |
| **7 — Spectator Mode** | 🔮 Planned | Live share links, read-only view, reactions |
| **8 — Leaderboard** | 🔮 Planned | Persistent scores, win rates, public feed |
| **9 — Public Deployment** | 🔮 Planned | Docker, Railway/Render deployment, Vercel frontend, OG images |

---

## 14. Key Design Decisions

1. **SSE over WebSockets**: SSE is simpler (one-directional, HTTP-native), perfectly suited for the server-to-client event stream. The client doesn't need to send data back once the battle starts.

2. **One adapter to rule them all**: The OpenAI Chat Completions API has become the de-facto standard. A single `openai.js` adapter with a configurable `baseURL` covers OpenRouter, Groq, xAI, Together, Ollama, and any custom endpoint. Only Anthropic and Google need separate adapters.

3. **Server-authoritative battle**: Even though the client animates the fight, all logic (rounds, judging, HP) runs server-side. This prevents cheating and keeps the client as a pure presentation layer.

4. **Claude Opus as judge**: The judge role demands nuanced scoring of comedy — wit, creativity, burn quality. Claude Opus is chosen for its instruction-following and nuanced judgement capabilities.

5. **Pixel art over 3D/elegant graphics**: Pixel art is distinctive, scalable, and thematically perfect for a fighting game homage. It also avoids the uncanny valley of simple 3D models and is trivially themeable.

6. **Cost framing as feature**: Model API calls cost money, but the app turns this into dramatic pacing via SSE streaming. The latency from provider round-trips becomes part of the spectacle — each pause builds anticipation.

7. **BYOK eliminates auth**: By never storing keys, the project sidesteps the need for user accounts, OAuth flows, password resets, GDPR data concerns, and server-side secret management. This massively reduces surface area and operational complexity.

8. **Light mode uses Claude's palette**: Rather than a generic light theme, the light mode uses Claude's warm clay tones (`#D97757`) as the accent colour, tying the brand identity into the theme system itself.

---

*Generated by analysis of the Fight-Club-Models- repository, July 2026.*
