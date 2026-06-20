# AI Battle Arena — TODO

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

**Last updated:** 2026-06-20

---

## Phase 1 — Core Engine ✅
- [x] Express backend :8787 with SSE streaming
- [x] BYOK: keys in POST body, stripped from responses via `publicFighter()`
- [x] Three adapters (Anthropic, OpenAI-compat, Gemini) — unified `callModel()` shape
- [x] `resolveFighter()` / `publicFighter()` in `shared/`
- [x] Judge scores wit / creativity / burns; returns rationale
- [x] `/api/model/health-check` — test custom BYOK models
- [x] Modes: roast · prompt-injection · impersonation
- [x] Cost guard: hard round cap ≤5, `max_tokens` per turn, per-IP rate limit
- [x] Output sanitizer between turns (defang injection payloads)

## Phase 2 — Pixel Creatures ✅
- [x] 9 pixel-art creatures (16×20 char grid + palette map)
- [x] Provider → creature mapping in `pixelData.js`
- [x] `<PixelCreature>` canvas renderer (`image-rendering: pixelated`)
- [x] `<FighterSprite>` with Framer Motion states: idle · attack · hurt · ko · win

## Phase 3 — Classic Arcade Battle Page ✅
- [x] Fixed 380px arena stage (never scrolls)
- [x] `<HPBar>` — SF2-style, portrait thumbnail, spring animation, danger flash at 25%
- [x] `<SpeechBubble>` — spring pop-in above each creature, 120-char truncation
- [x] `<DamageFloat>` — floats up over the hit fighter
- [x] `<RoundAnnouncer>` — "ROUND N / FIGHT!" squish animation; K.O. variant
- [x] Screen flash on K.O., winner/loser sprite states, navigate to Result
- [x] `<CompactRound>` log scrolls below stage

## Phase 4 — Full UI/UX Redesign + Light Mode ✅
- [x] CSS variable theme system (dark / light)
- [x] **Light mode** — Claude's warm palette (`#FAF9F7`, `#D97757` accent, warm gray text)
- [x] Flash-of-wrong-theme prevented by inline script in `index.html`
- [x] `<ThemeToggle>` ☀️/🌙 — persists to `localStorage`
- [x] **VS Selector UX** — fighter slots with creature previews, active pulse, auto-advance
- [x] **Fighter roster grid** — click-to-assign, other-slot greyed out
- [x] Custom model form inline (collapsible)
- [x] `<KeysPanel>` — 2-column grid, dot indicators, light-mode aware
- [x] **Result page** — big winner creature 4× scale (win animation), K.O. loser in corner
- [x] All components (`ModelInventory`, `CompactRound`) use CSS vars

---

## Phase 5 — Polish & Social 🚧
- [ ] **Shareable replay link** — encode result in URL hash, reconstruct on load
- [ ] Mobile layout fine-tuning (arena stage height responsive)
- [ ] Respect `prefers-reduced-motion`
- [ ] Sound effects (muted by default): punch, KO thud, crowd roar
- [ ] "FIGHT!" voice clip on round start
- [ ] Combo counter / running score visible during battle
- [ ] Fighter win-streak tracker (session-local)
- [ ] Animated PNG/GIF export of winner creature

## Phase 6 — Share Card Generator (growth engine)
- [ ] Server-side PNG card (`@vercel/og` or `satori`)
- [ ] "Share to X" intent link with pre-filled text + card image
- [ ] Unique battle URL per fight

## Phase 7 — Tournament Mode
- [ ] 4-fighter bracket UI
- [ ] Single-elimination match history
- [ ] Champion reveal screen

## Phase 8 — Spectator Mode
- [ ] WebSocket relay for live share link
- [ ] Read-only spectator view — live HP + round feed
- [ ] Reaction bar (🔥💀👏)

## Phase 9 — Leaderboard
- [ ] Supabase / PlanetScale for persistence
- [ ] Win rates by model, mode, topic
- [ ] Public fights feed

## Phase 10 — Public Deployment
- [ ] Docker Compose for self-hosting
- [ ] Railway / Render deploy button for server
- [ ] Vercel for frontend
- [ ] Rate limiting per IP
- [ ] `ALLOWED_ORIGINS` env var for CORS
- [ ] Monitoring / alerting

---

## Parking Lot (post-launch)
- [ ] Replays from a URL (stored battle rounds → replay animation)
- [ ] Daily featured matchup (cron picks random fight each morning)
- [ ] More modes: Debate, Storytelling, Pickup-line
- [ ] User-submitted roast topics (vote on the topic before fight starts)
- [ ] Entertainment ELO leaderboard
- [ ] Live spectator mode (WebSocket rooms)
