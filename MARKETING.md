# Landing Page + Marketing Plan — Fight Club Models

> `/ship-product` Phase 3 (design spec) and Phase 4 (marketing plan).
> Decision: **standalone product, charged from v1.** Not a funnel for Burnstop.

**Written:** 2026-07-26 · **Status:** spec, not built

---

## 1. Positioning

> **Fight Club Models helps AI-curious developers find out which model is actually funnier, sharper, and harder to break — without reading a single benchmark table.**

The buyer is *not* "developers". It is: **people who follow model releases, argue about them online, and make or consume content about them.** They already have opinions about Claude vs GPT. You are selling them a way to settle it that produces a clip.

### Honest competitive position

| Competitor | What they own | Your gap in the market |
|---|---|---|
| [LMArena](https://lmarena.ai) — $1.7B, 5M MAU | Serious blind-vote evaluation. Owns "which model is better" as *research*. | They are rigorous and joyless. Nothing to screenshot. |
| [llm-fighter.com](https://llm-fighter.com) | *"Evaluate LLM agentic capabilities through combat games"* | Framed as **eval**, not entertainment. Combat is the metaphor, not the point. |
| [Your AI Slop Bores Me](https://www.youraislopboresmegame.com/) | Viral browser game, ~19k concurrent, *"100% Free"* | **Humans** pretend to be AI. Inverse concept. Zero monetization. |
| agent.ai LLM Battle | Ask one question, models pick a winner | A tool inside a platform, not a game |

**Nobody owns "gamified, personality-driven, player-authored model combat."** That is a genuine gap. It is also a gap because it is hard to monetize — go in with that understood, not discovered later.

---

## 2. Costume

Per the design system: **no house style — one costume per product, matched to its personality.** Three tokens only.

| Token | Value | Reasoning |
|---|---|---|
| Background | `#0a0a0f` | Already yours. Arcade near-black, CRT-adjacent. |
| Accent | **`#FFB627` arcade amber** | 🔴 **Change from `#D97757`.** Warm (satisfies the one real invariant), and **provider-neutral.** |
| Heading | **Press Start 2P** (hero only) + Bebas Neue (sections) | Pixel display for the one moment that must read "game"; Bebas carries the rest. |
| Body | Inter | Already yours. |
| Mono | JetBrains Mono | Stat lines, model IDs, token counts. Signals "built by a developer". |

### 🔴 On the accent colour

`#D97757` is **Anthropic's brand coral.** Your stated first principle is *"We belong to no provider."* Shipping a provider-agnostic arena painted in one competitor's brand colour undermines the position on sight, and GPT/Gemini partisans — a large slice of your traffic — will read it as bias before they read a word. Amber costs you nothing and fixes it.

Fighter identity colours (Claude coral, GPT green, Gemini blue) stay exactly as they are — those are *correct* there, because that's where provider identity belongs.

---

## 3. The page

**Headline** (formula: `<Verb> your <thing> without <the painful part>`):

> # Stop reading benchmarks. **Make them fight.**

**Sub-headline:**

> Pick two AI models. Deal your prompt cards. Watch them roast each other for three rounds while a judge model scores every line. 90 seconds, one shareable replay.

**CTA:** `INSERT COIN — FIGHT FREE` → **microcopy directly beneath, never floating:** *"No signup. Bring your own API key, or grab a token for $9."*

**Above the fold:** an autoplaying muted loop of an actual KO with the damage float and winner stamp. The product is visual; lead with the product.

🔴 **Boot-time budget.** The arena now renders through PixiJS (`GAME_DESIGN.md` §1), which adds bundle weight to the one path that matters most: a stranger tapping your share link on mobile data. **Set a hard budget — first frame under 2s on a mid-tier phone on 4G — and measure it before launch, not after.** Two mitigations are already in the design: tree-shaken Pixi imports, and the landing page staying pure DOM so it never loads the renderer at all. Pixi should load only when someone enters the arena.

### Section skeleton

| # | Section | Content for this product |
|---|---|---|
| 1 | Announcement bar | Latest model added — *"Claude Opus 5 has entered the arena →"* |
| 2 | Nav | Arena · Cards · Pricing · `FIGHT` button |
| 3 | Hero | Badge → headline → sub → CTA → microcopy → live counter |
| 4 | Visual proof | KO loop, then three real replay cards with results |
| 5 | Problem agitation | *"You've read the benchmark table. It said 89.2 vs 88.7. You still have no idea which one you'd rather talk to."* |
| 6 | Solution | Benchmark table screenshot **vs** a battle KO frame, side by side, arrow between |
| 7 | Features as outcomes | Not "SSE streaming" → **"Watch it happen live, not a results page"**. Not "BYOK" → **"Your keys never leave your browser"**. |
| 8 | Founder story + face | First person. *"I got tired of arguing about which model is better in Twitter replies, so I built somewhere they could settle it."* |
| 9 | Pricing | §4 below |
| 10 | Social proof | Real embedded replays and real posts. **Zero fabricated testimonials** — `decisions.md` 2026-07-25 already committed you to this. Leave the wall empty until it's real. |
| 11 | FAQ | Cost of my own keys? Is it rigged? Which models? Refunds? Can I add a local model? *(yes — Ollama)* |
| 12 | Final CTA | Identical button to the hero |
| 13 | Footer | Links to Burnstop and every future product |

**Page length:** 7,000px+. Every objection answered somewhere.

---

## 4. Pricing

Charge from v1 — `docs/03`, non-negotiable.

| Tier | Price | Contents |
|---|---|---|
| **Free** | $0 | BYOK, unlimited battles, 9 starter cards, replay links, all modes |
| **ARCADE TOKEN** | ~~$19~~ **$9 one-time** | No API key needed — 100 hosted battles · full 30-card deck · HD/GIF export, no watermark · custom fighter slots |

- **Scarcity, real and verifiable:** *"$10 off for the first 200 fighters (N left)"* — count it honestly or don't claim it.
- **Guarantee:** 30-day money-back, restated in the FAQ.
- **One-time, not subscription.** No churn, no dunning, easier decision while nobody knows you.

### Margin check (do this before you price, not after)

3 rounds × (2 fighter calls + 1 judge) = 9 calls ≈ **5.4k tokens/battle**. 100 battles ≈ 540k tokens. At frontier rates (~$3/M in, $15/M out) that's roughly **$3 of API cost against $9 of revenue — about 65% margin**, and better if hosted battles are capped to mid-tier models.

It works. But it only works with the cap — **let hosted play reach the most expensive frontier models unmetered and the token loses money on your heaviest users.** Put the cap in before launch, not after the first bill.

---

## 5. Launch

**Two weeks before:** build in public. Post the card designs — card balance arguments are free engagement and they *are* the product.

**Launch day:**

1. **Product Hunt** — 12:01am PT. Tagline: *"Make AI models fight. You're the cornerman."* First comment tells the personal story.
2. **Show HN** — `Show HN: Fight Club Models – AI models roast each other, you play the prompt cards`. Technical and honest: the latency-to-genre reasoning from `GAME_DESIGN.md` §0 is a genuinely good HN comment. **Answer everything.** HN punishes hype and rewards candour.
3. **r/LocalLLaMA** — read the self-promo rules first. **Lead with Ollama support** — that subreddit cares about local models more than about Claude vs GPT, and you already support it. That's your angle there, not the roast.
4. **r/singularity, r/ArtificialInteligence** — lead with a battle result, link at the bottom.
5. **X thread** — the annoyance → the build → the numbers, screenshots throughout.

**After:** publish the numbers regardless. A flop reported honestly outperforms a win reported smugly.

---

## 6. SEO — the compounding play

**Every shared replay becomes an indexable page.** This is the strongest long-term asset here and it depends entirely on shipping short replay IDs with server-side rendering (`GAME_DESIGN.md` §5).

- Auto-generated comparison pages: `/claude-vs-gpt`, `/gemini-vs-llama` — aggregate win rates across all public battles, refreshed nightly. **High commercial intent, and the content writes itself from data you already have.**
- Problem pages targeting *"which AI model is funnier"*, *"claude vs gpt personality"*
- The free arena is itself the top-of-funnel free tool

---

## 7. First 10 customers — manually

Skip the general AI audience; they won't pay. Go at **AI short-form creators** — the one consumer segment with demonstrated willingness to pay for export quality.

1. Find 30–50 people posting model-comparison content on X, YouTube Shorts, TikTok
2. **Run a battle featuring their handle as the topic. Send them the replay link.** Not a pitch — a gift they can post.
3. Offer the token free for feedback

This is slow and feels beneath you. It is the highest-conversion activity available and it produces your first real testimonials.

---

## 8. 🔴 The thing to keep checking

The evidence research found **no documented pain** behind this product and **every comparable is free**. It scored 24/30 — but on **Pain 2 / Pay 2**, with Reach 5 and Content 5.

That is the `apexattire.in` signature: reach without sales. `docs/07` is explicit that it repeats by default.

You've decided to run it as a standalone product anyway, which is a legitimate call — it's genuinely differentiated, the margin works, and it's the strongest content asset you own. So set the tripwire now, while it's cheap to set:

> **If 30 days after launch it has traffic and near-zero paid conversion, that is the apexattire pattern reproducing exactly. Cut it to a free funnel pointing at Burnstop and stop spending hours on it.**

Write that number in `progress/metrics.md` before launch day. Deciding the kill condition in advance is the only defence that has ever worked against this failure mode — afterwards, the traffic will feel like a reason to keep going.

---

**Sources:** [LMArena $1.7B / 5M MAU](https://techcrunch.com/2026/01/06/lmarena-lands-1-7b-valuation-four-months-after-launching-its-product/) · [LMArena $150M raise](https://www.prnewswire.com/news-releases/lmarena-raises-150-million-to-build-the-worlds-most-trusted-ai-evaluation-platform-302653012.html) · [LLM Fighter](https://llm-fighter.com/) · [Your AI Slop Bores Me](https://www.youraislopboresmegame.com/) · [Indie market data](https://fungies.io/indie-developer-market-analysis-2026/)
