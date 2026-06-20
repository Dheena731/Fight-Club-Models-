# AI Battle Arena — Roadmap

> A live, game-feel arena where AI models fight in Roast / Prompt-Injection / Impersonation battles with pixel-art creatures, SF2-style health bars, and BYOK keys.

**Last updated:** 2026-06-20
**Status:** Phase 4 complete — public deployment next

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
└──────────────────────────────────────────────────────────┘
                      │  HTTPS  (keys travel per-request)
                      ▼
       Anthropic API   OpenAI API   Google Gemini API
       Groq API        Together     xAI API   Ollama (local)
```

**Key principles**
- API keys live only in the browser (`localStorage`). Server never persists them.
- `resolveFighter(spec)` normalises built-in and custom specs. `publicFighter(f)` strips keys before any SSE payload.
- Battle is server-authoritative: round loop, judge scoring, HP accounting all happen server-side.

---

## ✅ Phase 1 — Core Engine
- [x] Express + SSE streaming battle loop
- [x] BYOK: keys in POST body, stripped from responses via `publicFighter()`
- [x] Three adapters (Anthropic, OpenAI-compat, Gemini) with unified `callModel()` shape
- [x] `resolveFighter()` / `publicFighter()` in `shared/`
- [x] Judge scores wit / creativity / burns; returns rationale
- [x] `/api/model/health-check` — test custom BYOK models before a fight
- [x] Modes: roast · prompt-injection · impersonation

## ✅ Phase 2 — Pixel Creatures
- [x] 9 pixel-art creatures (16×20 char grid + palette map)
- [x] Provider → creature: claude→owl · gpt→fox · gemini→serpent · groq→cheetah · ollama→llama · openrouter→octopus · xai→bull · together→bee · custom→robot
- [x] `<PixelCreature>` canvas renderer — `image-rendering: pixelated`, `brightness()` filter
- [x] `<FighterSprite>` — Framer Motion states: idle (bob) · attack (lunge) · hurt (shake+flash) · ko (tip) · win (jump)

## ✅ Phase 3 — Classic Arcade Battle Page
- [x] Fixed 380px arena stage (never scrolls) — ambient glow per fighter corner, scanline overlay
- [x] SF2-style HP bars: portrait thumbnail, spring animation, color shifts at 50 %/25 %, danger flash
- [x] `<SpeechBubble>` — spring pop-in above each creature, auto-truncates at 120 chars
- [x] `<DamageFloat>` — red "-N HP" floats up over the hit fighter
- [x] `<RoundAnnouncer>` — "ROUND N" squishes from scaleX(2.2), "FIGHT!" fades below; K.O. variant
- [x] Screen flash on K.O., winner→win state, loser→ko state, navigate to Result
- [x] `<CompactRound>` log scrolls below stage — round badge · lines · judge rationale

## ✅ Phase 4 — Full UI/UX Redesign + Light Mode
- [x] CSS variable theme system (`--c-bg`, `--c-card`, `--c-text`, `--c-accent`, …)
- [x] Dark mode: current arcade palette (`#0a0a0f`, `#13131a`, `#1e1e2e`)
- [x] **Light mode: Claude's warm palette** (`#FAF9F7` bg, `#FFFFFF` card, `#D97757` accent, warm gray text)
- [x] Flash-of-wrong-theme prevented by inline `<script>` in `index.html`
- [x] `<ThemeToggle>` ☀️/🌙 button — persists to `localStorage`
- [x] **VS Selector UX** — two fighter slots with creature previews, active-slot pulse, auto-advance A→B
- [x] **Fighter roster grid** — single list, click-to-assign, other-slot greyed out
- [x] Custom model form integrated inline (collapsible)
- [x] `<KeysPanel>` 2-column grid, per-provider dot indicators, light-mode aware
- [x] **Result page** — big winner creature (4× scale, win animation), K.O. loser in corner
- [x] All sub-components (`ModelInventory`, `CompactRound`, `KeysPanel`) themed with CSS vars
- [x] Arena stage always stays dark (`.arena-dark`) regardless of page theme

---

## 🚧 Phase 5 — Polish & Social (next)
- [ ] Shareable replay link — encode result in URL hash, reconstruct on load
- [ ] Animated PNG/GIF export of the winner creature for posting
- [ ] Sound effects: punch SFX on attack, KO thud, crowd roar (muted by default, toggle)
- [ ] "FIGHT!" voice clip on round start
- [ ] Combo counter / running score visible during battle
- [ ] Fighter win-streak tracker (session-local)
- [ ] Mobile layout fine-tuning (arena stage height responsive)

## 🔮 Phase 6 — Tournament Mode
- [ ] 4-fighter bracket tournament
- [ ] Single-elimination bracket UI with match history
- [ ] Champion reveal screen

## 🔮 Phase 7 — Spectator Mode
- [ ] Shareable live battle link (WebSocket relay)
- [ ] Read-only spectator view with live HP + round feed
- [ ] Spectator reaction bar (🔥💀👏)

## 🔮 Phase 8 — Leaderboard
- [ ] Optional persistent leaderboard (Supabase or PlanetScale)
- [ ] Win-rate by model, mode, topic
- [ ] Recent fights public feed

## 🔮 Phase 9 — Public Deployment
- [ ] Docker Compose for self-hosting
- [ ] Railway / Render one-click deploy button
- [ ] Vercel edge for frontend
- [ ] Rate limiting per IP
- [ ] `ALLOWED_ORIGINS` env var for CORS lock-down
- [ ] OG image generation for battle share cards (`@vercel/og`)

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
