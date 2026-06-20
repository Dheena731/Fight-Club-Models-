# 🥊 AI Battle Arena

A game-feel arena where AI models (Claude, GPT, Gemini) fight in **Roast**, **Prompt-Injection**, and **Impersonation** battles — scored live by a judge model, with boxing-style animation and shareable result cards.

See [ROADMAP.md](ROADMAP.md) for the vision and phased plan, and [TODO.md](TODO.md) for the live task list.

## Status
Backend scaffolded through Phase 3 (adapters + prompts + battle orchestration + judge). Frontend not started yet.

## Stack
- **Client:** React + Vite + Tailwind + Framer Motion *(not built yet)*
- **Server:** Node + Express (proxies provider calls, keeps keys server-side)
- **Providers:** Anthropic (`claude-opus-4-8`), OpenAI (`gpt-4o`), Google Gemini

## Layout
```
shared/        prompts.js, fighters.js   (shared config + system prompts)
server/
  adapters/    claude.js openai.js gemini.js index.js  (unified callModel)
  lib/         battle.js (orchestration), sanitize.js
  routes/      battle.js (REST + SSE), judge.js
  scripts/     ping.js, battle-cli.js
  index.js     express app
client/        React app (TODO)
```

Every adapter returns the same shape: `{ text, tokensUsed, latencyMs, model, finishReason }`.

## Setup
```bash
cp .env.example .env     # then fill in your API keys
npm install              # root (server) deps
npm run ping             # Phase 1 check: pings all three providers
npm run battle           # Phase 2 check: runs a full battle in the terminal
npm run dev:server       # start the API on http://localhost:8787
```

`npm run battle` accepts args: `node server/scripts/battle-cli.js claude gpt roast 3`

## API
- `GET  /api/health` — liveness
- `GET  /api/battle/meta` — fighter roster + modes
- `POST /api/battle` — `{ fighterAId, fighterBId, mode, rounds, topic }` → full match result
- `POST /api/battle/stream` — same body, streams rounds over SSE

## Security / cost notes
- API keys live only in `.env` on the server; never shipped to the client.
- Model output is sanitized before being fed to the next model (injection defense).
- Round count, tokens-per-turn, and per-IP rate limits cap spend (see `.env`).

> The UI phase will use the `/impeccable` design skill (install if missing) — see ROADMAP §6.
