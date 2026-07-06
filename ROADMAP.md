# AI Battle Arena — Roadmap

> The "Stadium of AI": a live, competitive AI gaming platform where models battle across dozens of game modes with pixel-art creatures, SF2-style health bars, and BYOK keys.
>
> See [PRODUCTION_BIBLE.md](./PRODUCTION_BIBLE.md) for the full product vision and principles.

**Last updated:** 2026-07-03
**Status:** Phase 0 (Foundation) complete — Phase 1 (MVP Launch) in progress

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  CLIENT  React + Vite + Tailwind + Framer Motion          │
│  Home (VS selector) → Battle (arcade stage) → Result     │
└─────────────────────┬────────────────────────────────────┘
                      │  POST /api/battle/stream  (SSE)
                      ▼
┌──────────────────────────────────────────────────────────┐
│  SERVER  Node 18 + Express :8787                          │
│  routes/battle.js  → round loop + SSE                    │
│  routes/judge.js   → scores each round                   │
│  routes/model.js   → health-check custom models          │
│  adapters/{claude,openai,gemini}.js  → unified callModel │
│  shared/resolveFighter.js  → BYOK normalisation          │
└──────────────────────┬───────────────────────────────────┘
                       │  HTTPS  (keys travel per-request)
                       ▼
        Anthropic API   OpenAI API   Google Gemini API
        Groq API        Together     xAI API   Ollama (local)
```

**Key principles**
- **Entertainment First** — If it's not fun to watch, it doesn't belong in the product
- **Fair Competition** — Every model gets equal opportunity; no provider advantage
- **Transparency** — Every battle is replayable, auditable, and fully inspectable
- **Extensibility** — Any provider, any model, any future AI — always supported
- **Community Driven** — The community creates the content, modes, and culture
- **AI Agnostic** — We belong to no provider (OpenAI, Anthropic, Google, X, etc.)
- **BYOK-first** — API keys live only in the browser; never persisted on the server
- **Server-authoritative** — Round loop, judge scoring, HP accounting all happen server-side

---

## ✅ Phase 0 — Foundation (Complete)

The current codebase. Core battle engine, pixel creatures, arcade arena UI, theming, and BYOK system.

### Battle Engine
- [x] Express + SSE streaming battle loop
- [x] BYOK: keys in POST body, stripped from responses via `publicFighter()`
- [x] Three adapters (Anthropic, OpenAI-compat, Gemini) with unified `callModel()` shape
- [x] `resolveFighter()` / `publicFighter()` in `shared/`
- [x] Judge scores wit / creativity / burns; returns rationale
- [x] `/api/model/health-check` — test custom BYOK models before a fight
- [x] Modes: roast · prompt-injection · impersonation
- [x] Cost guard: hard round cap ≤5, `max_tokens` per turn, per-IP rate limit
- [x] Output sanitizer between turns (defang injection payloads)

### Pixel Creatures
- [x] 9 pixel-art creatures (16×20 char grid + palette map)
- [x] Provider → creature: claude→owl · gpt→fox · gemini→serpent · groq→cheetah · ollama→llama · openrouter→octopus · xai→bull · together→bee · custom→robot
- [x] `<PixelCreature>` canvas renderer — `image-rendering: pixelated`, `brightness()` filter
- [x] `<FighterSprite>` — Framer Motion states: idle (bob) · attack (lunge) · hurt (shake+flash) · ko (tip) · win (jump)

### Arcade Arena UI
- [x] Fixed 380px arena stage (never scrolls) — ambient glow per fighter corner, scanline overlay
- [x] SF2-style HP bars: portrait thumbnail, spring animation, color shifts at 50%/25%, danger flash
- [x] `<SpeechBubble>` — spring pop-in above each creature, auto-truncates at 120 chars
- [x] `<DamageFloat>` — red "-N HP" floats up over the hit fighter
- [x] `<RoundAnnouncer>` — "ROUND N" squishes from scaleX(2.2), "FIGHT!" fades below; K.O. variant
- [x] Screen flash on K.O., winner→win state, loser→ko state, navigate to Result
- [x] `<CompactRound>` log scrolls below stage — round badge · lines · judge rationale

### Theme & UI System
- [x] CSS variable theme system (`--c-bg`, `--c-card`, `--c-text`, `--c-accent`, …)
- [x] Dark mode: arcade palette (`#0a0a0f`, `#13131a`, `#1e1e2e`)
- [x] Light mode: Claude's warm palette (`#FAF9F7` bg, `#FFFFFF` card, `#D97757` accent)
- [x] Flash-of-wrong-theme prevented by inline `<script>` in `index.html`
- [x] `<ThemeToggle>` ☀️/🌙 button — persists to `localStorage`
- [x] VS Selector UX — two fighter slots with creature previews, active-slot pulse, auto-advance A→B
- [x] Fighter roster grid — click-to-assign, other-slot greyed out
- [x] Custom model form integrated inline (collapsible)
- [x] `<KeysPanel>` 2-column grid, per-provider dot indicators, light-mode aware
- [x] Result page — big winner creature (4× scale, win animation), K.O. loser in corner
- [x] All sub-components themed with CSS vars
- [x] Arena stage always stays dark (`.arena-dark`) regardless of page theme

---

## 🚧 Phase 1 — MVP Launch (Next)

Polish, shareability, and quality-of-life features to make the product ready for public use.

- [ ] **Shareable replay link** — encode result in URL hash, reconstruct on load
- [ ] Server-side OG image generation (`@vercel/og` or `satori`) for battle share cards
- [ ] "Share to X" intent link with pre-filled text + card image
- [ ] Sound effects: punch SFX on attack, KO thud, crowd roar (muted by default, toggle)
- [ ] "FIGHT!" voice clip on round start
- [ ] Combo counter / running score visible during battle
- [ ] Fighter win-streak tracker (session-local)
- [ ] Animated PNG/GIF export of winner creature
- [ ] Mobile layout fine-tuning (arena stage height responsive)
- [ ] Respect `prefers-reduced-motion`
- [ ] Rate limiting per IP (hardened)
- [ ] `ALLOWED_ORIGINS` env var for CORS lock-down
- [ ] Docker Compose for self-hosting
- [ ] Railway / Render one-click deploy for server
- [ ] Vercel edge for frontend

---

## 🔮 Phase 2 — Product (User Ecosystem)

User accounts, profiles, and persistent battle history.

- [ ] User authentication (email, GitHub, Google)
- [ ] User profiles with display name, avatar, bio
- [ ] Battle history with permanent URLs
- [ ] Dashboard: wins, losses, favourite models, recent battles
- [ ] Daily challenges and missions
- [ ] Battle statistics and analytics per user
- [ ] Session management and persistence
- [ ] Database setup (Supabase / PlanetScale)

---

## 🔮 Phase 3 — Social (Multiplayer)

Friends, chat, spectator modes, and community features.

- [ ] Friends list and social graph
- [ ] Chat system (lobby, room, battle)
- [ ] Spectator mode for live battles (WebSocket relay)
- [ ] Comments, reactions, and voting on battles
- [ ] Party system for group play
- [ ] Live shareable battle links
- [ ] Spectator reaction bar (🔥💀👏)

---

## 🔮 Phase 4 — Competitive (Ranked Play)

Ranked matchmaking, seasonal leaderboards, and achievement systems.

- [ ] Ranked matchmaking (Bronze → Silver → Gold → Platinum → Diamond → Legend)
- [ ] Seasonal leaderboards with rewards
- [ ] ELO / MMR rating system
- [ ] Achievements and badges
- [ ] Ranked rewards and cosmetics
- [ ] Win-rate by model, mode, topic
- [ ] Public fights feed
- [ ] Anti-cheating and fair play measures

---

## 🔮 Phase 5 — RPG System (Progression)

AI fighters with levels, stats, equipment, and customizable loadouts.

- [ ] AI fighter levels and XP system
- [ ] Fighter stats (power, defence, speed, charisma, etc.)
- [ ] Equipment system (prompt cards, modifiers)
- [ ] Passive skills and active abilities
- [ ] Customizable loadouts and presets
- [ ] Fighter unlock system
- [ ] Team building (multiple fighters per player)

---

## 🔮 Phase 6 — Tournaments

Automated bracket generation, multiple formats, and prize pools.

- [ ] Single-elimination bracket UI
- [ ] Double-elimination bracket support
- [ ] Swiss-system tournament support
- [ ] Automated bracket generation and seeding
- [ ] Prize pools and rewards distribution
- [ ] Tournament spectator support
- [ ] Community-organised tournaments
- [ ] Official platform tournaments
- [ ] Champion reveal screen with ceremony

---

## 🔮 Phase 7 — Creator Platform

User-generated content: custom game modes, judges, arenas, and prompts.

- [ ] Creator Studio interface
- [ ] Custom game mode creation (rules, scoring, win conditions)
- [ ] Custom judge creation (custom scoring criteria)
- [ ] Custom arena themes and skins
- [ ] Prompt card editor
- [ ] Workshop for sharing and discovering creations
- [ ] SDK for advanced creators (API access)
- [ ] Ratings, reviews, and reporting for UGC
- [ ] Featured creations curation

---

## 🔮 Phase 8 — Marketplace

Cosmetic items, prompt packs, and creator economy.

- [ ] Cosmetic item store (creature skins, arena themes, effects)
- [ ] Prompt pack marketplace (curated prompt strategies)
- [ ] Arena and skin marketplace
- [ ] Creator revenue sharing (70/30 split)
- [ ] Trading and gifting system
- [ ] Seasonal battle passes
- [ ] Premium subscription tier
- [ ] In-platform currency system

---

## 🔮 Phase 9 — AI Esports

Professional league, live commentary, major prize pools, and sponsorships.

- [ ] Professional league structure
- [ ] Season system (placement → regular season → playoffs → finals)
- [ ] Live commentary system (human + AI co-commentator)
- [ ] Major prize pools and sponsorship integration
- [ ] Professional player/team profiles
- [ ] Live broadcast mode (overlays, graphics, replays)
- [ ] Brand sponsorship integration
- [ ] Media rights and licensing
- [ ] Live arena events (physical + virtual)

---

## Models (verified IDs)

| Fighter | Provider | Model ID |
|---|---|---|
| Claude | Anthropic | `claude-sonnet-4-6` |
| GPT-4o | OpenAI | `gpt-4o` |
| Gemini | Google | `gemini-1.5-pro` |
| Groq (fast) | Groq | `llama-3.3-70b-versatile` |

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Model refuses to roast | "Comedy show, all consented" framing; forfeit-turn on refusal |
| Prompt-injection mode breaks our own app | Sanitize model output before feeding downstream |
| Costs spiral | Hard round cap (≤5), `max_tokens` per turn, per-IP rate limit |
| One provider down | Per-adapter try/catch → graceful "technical KO" turn |
| Latency kills vibe | SSE streaming masks latency as dramatic tension |
| Low user retention | Entertainment-first design; community features drive stickiness |
| UGC quality control | Rating systems, reporting, curated featured section |
| Platform abuse | Rate limiting, key-only model access, battle caps per user |

---

*See [PRODUCTION_BIBLE.md](./PRODUCTION_BIBLE.md) for full product vision, principles, and audience definitions.*
