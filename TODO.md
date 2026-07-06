# AI Battle Arena — TODO

> Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

**Last updated:** 2026-07-03
**Source:** [PRODUCTION_BIBLE.md](./PRODUCTION_BIBLE.md)

---

## Phase 0 — Foundation ✅

### Battle Engine
- [x] Express + SSE streaming battle loop
- [x] BYOK: keys in POST body, stripped from responses via `publicFighter()`
- [x] Three adapters (Anthropic, OpenAI-compat, Gemini) — unified `callModel()` shape
- [x] `resolveFighter()` / `publicFighter()` in `shared/`
- [x] Judge scores wit / creativity / burns; returns rationale
- [x] `/api/model/health-check` — test custom BYOK models
- [x] Modes: roast · prompt-injection · impersonation
- [x] Cost guard: hard round cap ≤5, `max_tokens` per turn, per-IP rate limit
- [x] Output sanitizer between turns (defang injection payloads)

### Pixel Creatures
- [x] 9 pixel-art creatures (16×20 char grid + palette map)
- [x] Provider → creature mapping in `pixelData.js`
- [x] `<PixelCreature>` canvas renderer (`image-rendering: pixelated`)
- [x] `<FighterSprite>` with Framer Motion states: idle · attack · hurt · ko · win

### Arcade Arena UI
- [x] Fixed 380px arena stage (never scrolls)
- [x] `<HPBar>` — SF2-style, portrait thumbnail, spring animation, danger flash at 25%
- [x] `<SpeechBubble>` — spring pop-in above each creature, 120-char truncation
- [x] `<DamageFloat>` — floats up over the hit fighter
- [x] `<RoundAnnouncer>` — "ROUND N / FIGHT!" squish animation; K.O. variant
- [x] Screen flash on K.O., winner/loser sprite states, navigate to Result
- [x] `<CompactRound>` log scrolls below stage

### Theme & UI System
- [x] CSS variable theme system (dark / light)
- [x] Light mode — Claude's warm palette (`#FAF9F7`, `#D97757` accent, warm gray text)
- [x] Flash-of-wrong-theme prevented by inline script in `index.html`
- [x] `<ThemeToggle>` ☀️/🌙 — persists to `localStorage`
- [x] VS Selector UX — fighter slots with creature previews, active pulse, auto-advance
- [x] Fighter roster grid — click-to-assign, other-slot greyed out
- [x] Custom model form inline (collapsible)
- [x] `<KeysPanel>` — 2-column grid, dot indicators, light-mode aware
- [x] Result page — big winner creature 4× scale (win animation), K.O. loser in corner
- [x] All components (`ModelInventory`, `CompactRound`) use CSS vars

---

## Phase 1 — MVP Launch 🚧

### Share & Social Proof
- [ ] Shareable replay link — encode result in URL hash, reconstruct on load
- [ ] Server-side OG image generation (`@vercel/og` or `satori`) for battle share cards
- [ ] "Share to X" intent link with pre-filled text + card image

### Audio & Juice
- [ ] Sound effects: punch SFX on attack, KO thud, crowd roar (muted by default, toggle)
- [ ] "FIGHT!" voice clip on round start

### Gameplay Polish
- [ ] Combo counter / running score visible during battle
- [ ] Fighter win-streak tracker (session-local)
- [ ] Animated PNG/GIF export of winner creature

### Mobile & Accessibility
- [ ] Mobile layout fine-tuning (arena stage height responsive)
- [ ] Respect `prefers-reduced-motion`

### Deployment & Ops
- [ ] Rate limiting per IP (hardened config)
- [ ] `ALLOWED_ORIGINS` env var for CORS lock-down
- [ ] Docker Compose for self-hosting
- [ ] Railway / Render one-click deploy for server
- [ ] Vercel edge for frontend
- [ ] Monitoring and alerting

---

## Phase 2 — Product (User Ecosystem) 🔮

### User Accounts
- [ ] User authentication (email + password)
- [ ] OAuth: GitHub login
- [ ] OAuth: Google login
- [ ] Email verification flow
- [ ] Password reset flow
- [ ] Session management with JWT

### Profiles
- [ ] User profile page (display name, avatar, bio)
- [ ] Profile settings and preferences
- [ ] Avatar upload and cropping

### Battle History
- [ ] Battle history with permanent URLs (database-backed)
- [ ] Battle detail page (full replay of rounds)
- [ ] Battle search and filtering
- [ ] Battle deletion and privacy controls

### Dashboard
- [ ] User dashboard: wins, losses, win rate
- [ ] Favourite models tracking
- [ ] Recent battles list
- [ ] Activity feed

### Database
- [ ] Database schema design (users, battles, rounds, etc.)
- [ ] Supabase or PlanetScale setup
- [ ] Migrations and seeding
- [ ] Data export for users

### Daily Missions
- [ ] Daily challenge system
- [ ] Mission types: win with X model, play Y battles, etc.
- [ ] Mission rewards tracking
- [ ] Streak bonuses

---

## Phase 3 — Social (Multiplayer) 🔮

### Friends & Social Graph
- [ ] Send/receive friend requests
- [ ] Friends list UI
- [ ] Block user functionality
- [ ] Social feed (friends' recent battles)

### Chat
- [ ] Lobby chat (global)
- [ ] Room chat (per-battle)
- [ ] Direct messaging between users
- [ ] Chat moderation tools

### Spectator Mode
- [ ] WebSocket relay for live battle streaming
- [ ] Read-only spectator view — live HP + round feed
- [ ] Spectator count display
- [ ] Join/leave notifications

### Reactions & Comments
- [ ] Battle reaction buttons (🔥💀👏)
- [ ] Battle commenting system
- [ ] Nested replies for comments
- [ ] Reaction notifications

### Party System
- [ ] Create/join parties
- [ ] Party leader controls
- [ ] Party chat
- [ ] Queue as party for battles

---

## Phase 4 — Competitive (Ranked Play) 🔮

### Matchmaking
- [ ] Ranked queue system
- [ ] MMR/ELO rating calculation
- [ ] Matchmaking algorithm (skill-based)
- [ ] Queue time estimates
- [ ] Region-based matchmaking

### Ranking Tiers
- [ ] Bronze tier
- [ ] Silver tier
- [ ] Gold tier
- [ ] Platinum tier
- [ ] Diamond tier
- [ ] Legend tier
- [ ] Tier promotion/demotion matches

### Seasons
- [ ] Seasonal leaderboards
- [ ] Season duration and schedule
- [ ] Season rewards (cosmetics, badges)
- [ ] Season reset mechanics
- [ ] Season recap/history

### Achievements
- [ ] Achievement definitions and categories
- [ ] Achievement progress tracking
- [ ] Achievement unlock notifications
- [ ] Achievement showcase on profiles
- [ ] Hidden/secret achievements

### Leaderboards
- [ ] Global leaderboard
- [ ] Per-model leaderboard
- [ ] Per-mode leaderboard
- [ ] Friends leaderboard
- [ ] Leaderboard caching and performance

---

## Phase 5 — RPG System (Progression) 🔮

### Fighter Progression
- [ ] Fighter XP gain per battle
- [ ] Level-up system (1-100)
- [ ] Stat increases per level
- [ ] Prestige/rebirth system (optional)

### Fighter Stats
- [ ] Power (damage output)
- [ ] Defence (damage reduction)
- [ ] Speed (turn order)
- [ ] Charisma (judge favour)
- [ ] Intelligence (mode-specific bonus)
- [ ] Stat display UI

### Equipment
- [ ] Prompt card system (modify fighter behaviour)
- [ ] Card rarity tiers (common → legendary)
- [ ] Card slots (offensive, defensive, utility)
- [ ] Card crafting/upgrading
- [ ] Card collection UI

### Skills & Abilities
- [ ] Passive skills (always-active bonuses)
- [ ] Active abilities (per-battle use)
- [ ] Skill tree for each fighter
- [ ] Skill unlock requirements
- [ ] Skill cooldowns and limitations

### Loadouts
- [ ] Loadout slots (at least 3 presets)
- [ ] Drag-and-drop loadout editor
- [ ] Loadout sharing
- [ ] Quick-swap before battle

### Fighter Unlocks
- [ ] Fighter unlock requirements
- [ ] New fighter acquisition
- [ ] Fighter mastery system
- [ ] Fighter collection UI

---

## Phase 6 — Tournaments 🔮

### Bracket Formats
- [ ] Single-elimination bracket
- [ ] Double-elimination bracket
- [ ] Swiss-system tournament
- [ ] Round-robin group stage
- [ ] Custom bracket formats

### Tournament UI
- [ ] Bracket visualization (interactive tree)
- [ ] Tournament details page (rules, prizes, participants)
- [ ] Live bracket updates during tournament
- [ ] Match scheduling display
- [ ] Tournament archive

### Tournament Management
- [ ] Automated bracket generation and seeding
- [ ] Check-in system before tournament start
- [ ] No-show handling and replacements
- [ ] Bracket rebalancing
- [ ] Admin controls for official tournaments

### Community Tournaments
- [ ] Community tournament creation
- [ ] Tournament templates (quick setup)
- [ ] Participant cap and waitlist
- [ ] Community tournament visibility (public/private)

### Prize & Rewards
- [ ] Prize pool configuration
- [ ] Reward distribution per placement
- [ ] Trophy/badge for winners
- [ ] Prize claim system

### Spectator Support
- [ ] Tournament bracket viewing (non-participant)
- [ ] Featured matches during tournament
- [ ] Tournament commentary channel

---

## Phase 7 — Creator Platform 🔮

### Creator Studio
- [ ] Creator Studio landing page
- [ ] Template library (starting points for modes)
- [ ] Version history for creations
- [ ] Draft/publish workflow

### Custom Game Modes
- [ ] Mode parameter configuration (rounds, timing, scoring)
- [ ] Custom rules editor
- [ ] Win condition configuration
- [ ] Mode testing sandbox
- [ ] Mode publishing and visibility

### Custom Judges
- [ ] Judge prompt editor
- [ ] Scoring criteria configuration (name, weight, scale)
- [ ] Judge personality configuration
- [ ] Judge testing with sample battles
- [ ] Judge marketplace integration

### Custom Arenas
- [ ] Arena theme editor (colours, backgrounds, effects)
- [ ] Custom arena assets (upload images)
- [ ] Arena animation configuration
- [ ] Arena publishing

### Workshop
- [ ] Workshop browse page (featured, popular, recent)
- [ ] Categories and tags
- [ ] Search and filtering
- [ ] Install/subscribe to creations
- [ ] Ratings and reviews
- [ ] Reporting system for inappropriate content

### SDK
- [ ] Public API for creator tools
- [ ] API authentication for creators
- [ ] API documentation
- [ ] Example projects and templates
- [ ] Rate limits and quotas for API access

---

## Phase 8 — Marketplace 🔮

### Cosmetic Store
- [ ] Creature skins (colour variants, full redesigns)
- [ ] Arena themes (backgrounds, stages, effects)
- [ ] HP bar skins
- [ ] Damage number styles
- [ ] Announcer voice packs
- [ ] Victory animations

### Prompt Pack Marketplace
- [ ] Prompt pack creation by community
- [ ] Prompt pack categories (offensive, defensive, mode-specific)
- [ ] Prompt pack ratings and reviews
- [ ] Prompt pack compatibility (which modes/models)

### Creator Revenue Sharing
- [ ] Revenue split configuration (70% creator / 30% platform default)
- [ ] Payout system (thresholds, methods, scheduling)
- [ ] Creator earnings dashboard
- [ ] Tax documentation and reporting
- [ ] Fraud detection for marketplace items

### Trading & Gifting
- [ ] Item trading between users
- [ ] Gift system (purchase and send)
- [ ] Trading cooldowns and limits
- [ ] Marketplace transaction history

### Battle Pass
- [ ] Seasonal battle pass (free + premium track)
- [ ] XP progression through battles
- [ ] Tier unlocks (cosmetics, currency, badges)
- [ ] Premium pass purchase
- [ ] Battle pass archive (missed items shop)

### Currency System
- [ ] Free currency (earned through play)
- [ ] Premium currency (purchased)
- [ ] Currency exchange rates
- [ ] Purchase flow (web, mobile)

---

## Phase 9 — AI Esports 🔮

### Professional League
- [ ] League structure design (divisions, conferences)
- [ ] Season format (placement → regular → playoffs → finals)
- [ ] Team management (roster, transfers, branding)
- [ ] Player contracts and registration
- [ ] League rules and code of conduct

### Live Commentary
- [ ] Human commentator tools (overlay controls, play-by-play)
- [ ] AI co-commentator (auto-generated analysis)
- [ ] Commentator queue and matching
- [ ] Replay review system for casters

### Broadcast Mode
- [ ] Professional broadcast overlay
- [ ] Lower thirds, scorebugs, graphics
- [ ] Instant replay system
- [ ] Camera angles and scene switching
- [ ] Stream output (RTMP, Twitch, YouTube)

### Sponsorships
- [ ] Sponsor integration in broadcast overlays
- [ ] Sponsor banners and interstitial ads
- [ ] Branded arena skins
- [ ] Sponsored tournaments and events
- [ ] Sponsor dashboard (impressions, clicks)

### Prize Pools
- [ ] Crowdfunded prize pools (in-game purchases)
- [ ] Sponsor contributions
- [ ] Platform contribution
- [ ] Prize distribution across placements
- [ ] Prize claim and tax handling

### Live Events
- [ ] Physical event support (LAN)
- [ ] Virtual event support (online)
- [ ] Hybrid event support
- [ ] Ticket sales and management
- [ ] Event production tools (stage management, scheduling)

---

## Parking Lot (Post-Launch Ideas)

- [ ] **More battle modes**: Debate, Storytelling, Pickup-line, Coding Challenge, Translation Face-off, Riddle Contest, Poetry Slam, Sales Pitch, Negotiation, Lie Detection
- [ ] **Human vs AI mode** — humans compete directly against models
- [ ] **Human + AI tag-team** — collaborative human-AI teams
- [ ] **Co-op campaign** — AI partners against AI bosses
- [ ] **AI training mode** — models learn from battle outcomes (fine-tuning integration)
- [ ] **Daily featured matchup** — cron picks random fight each morning
- [ ] **User-submitted topics** — vote on the topic before fight starts
- [ ] **Entertainment ELO** — separate ranking for entertainment value
- [ ] **Replays from URL** — stored battle rounds → replay animation
- [ ] **AI-generated commentary** — automated play-by-play from a model
- [ ] **Mobile apps** — native iOS and Android apps
- [ ] **Desktop app** — Electron or Tauri wrapper with enhanced features
- [ ] **VR spectator mode** — watch battles in virtual reality
- [ ] **API for external apps** — embed battles in other websites
- [ ] **Custom model fine-tuning** — train models on battle data
- [ ] **Cross-platform accounts** — sync progress across devices
- [ ] **Localization** — i18n for major languages (JP, KR, CN, EU languages)

---

*See [PRODUCTION_BIBLE.md](./PRODUCTION_BIBLE.md) for full product vision, pillars, and audience definitions.*
