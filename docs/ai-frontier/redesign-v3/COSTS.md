# Infrastructure and AI cost scenarios

Planning estimates in USD, checked 2026-11-04. These are scenario calculations, not observed usage or a hosting capacity test. The scope is the proposed single-player browser adventure with local saves. Multiplayer, development labour, domains, taxes and payment fees are outside the figures.

## Price inputs

| Component | Price input | Primary provider source |
| --- | --- | --- |
| Static game files | Cloudflare static-asset requests are free; a Workers Paid account starts at $5/month if needed | [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) |
| Existing Express API | Render Starter $7/month; Standard $25/month provides a useful initial instance budget | [Render's instance price examples](https://render.com/articles/top-heroku-alternatives-agencies) |
| Budget example: Gemini 3.5 Flash-Lite | $0.30 / million input tokens; $2.50 / million output tokens | [Gemini Developer API pricing](https://aistudio.google.com/docs/pricing#gemini-3.5-flash-lite) |
| Higher-cost example: Claude Sonnet 5.5 | $2 / million input tokens; $10 / million output tokens | [Anthropic API pricing](https://platform.claude.com/docs/en/about-claude/pricing) |

Model examples illustrate the impact of a model choice; they are not the cheapest and most expensive models on the market, nor a final provider recommendation. Existing adapters must be verified before changing a built-in model. Free trial credits, caching, batch discounts, paid web search and external tool charges are excluded from these calculations. Artwork is produced once and served as files, so these scenarios do not generate images during play.

## Shared usage assumptions

- 20 battles per active player per month, averaging six rounds per battle.
- 1,500 input tokens and 500 billed output tokens per model request, including reasoning tokens where billed.
- One real-model decision request per round; the other side uses local game rules. Independent model calls for both sides approximately double the AI portion.
- Optional-live scenario: two of the 20 battles use real AI; the rest remain local.

`request cost = (input tokens × input rate + billed output tokens × output rate) / 1,000,000`.

That produces $0.0017 per request with the Gemini example and $0.008 with the Sonnet example.

## Monthly AI usage, before hosting

| Approach | Requests per player/month | 1,000 active players | 10,000 active players |
| --- | ---: | ---: | ---: |
| Keyless adventure + optional live battles | 12 | $20.40–$96 | $204–$960 |
| Real AI decisions in every battle | 120 | $204–$960 | $2,040–$9,600 |
| AI-inspired local game | 0 | $0 | $0 |

Add approximately $7–$25/month for a small initial deployment of the existing Express proxy when live calls are offered. A local-only game can start with static hosting at $0–$5/month. A 10,000-player deployment may need a larger proxy or extra services; measure concurrency and request duration before promising an instance size. Traffic volume, logging and any future cloud-save service can change that budget.

## A cheaper real-AI variant

One conditional plan per battle, reused across six locally resolved rounds, uses 20 requests per player/month instead of 120. Under the same token assumptions, all-battle real planning costs **$34–$160 at 1,000 players** or **$340–$1,600 at 10,000 players**, before hosting. This is six times fewer calls; measured token size may differ because a whole-battle plan could be longer.

For an early prototype, a proposed $30–$50 monthly budget is plausible for the budget-model optional-live scenario at 1,000 players. Enforce a real project usage cap and per-player allowance if adopting that target; it is not a guarantee that an uncapped deployment stays below it.

## Who pays

If players bring their own provider keys, model usage is charged to their provider accounts and the developer pays hosting. This changes the payer rather than removing AI cost. A consumer-facing free trial funded by the game creates an operator AI bill; its allowance and business model have not been selected.

The architectural recommendation under discussion is a keyless core adventure with bounded live coaching challenges, or the per-battle-plan variant if real AI must be central throughout. Avoid deciding between them using hosting cost alone: response delay, quality consistency and how much players enjoy coaching also need a prototype.
