# Built-in arena model review

Checked 2026-10-20 against the linked primary provider pages. This is **documentation metadata, not a live API test**. A player's access, limits, price, and actual request success may differ. The arena still requires an explicit provider-key preflight; no credentials or paid calls were used for this review.

| Built-in fighter | Model ID | Documented lifecycle | Primary source |
| --- | --- | --- | --- |
| Claude Sonnet 5 | `claude-sonnet-5` | Legacy on Anthropic's model page | [Claude Sonnet 5](https://platform.claude.com/docs/en/models/sonnet-5/overview) |
| GPT-4o | `gpt-4o` | Deprecated on OpenAI's model page | [GPT-4o model](https://developers.openai.com/api/docs/models/gpt-4o) |
| Gemini 3.6 Flash | `gemini-3.6-flash` | Stable in Google's model catalog | [Gemini models](https://ai.google.dev/gemini-api/docs/models) |

The corresponding `modelStatus` and `modelSourceUrl` fields are published with `shared/fighters.js` and can be shown before a paid match. Custom-model names are user-entered and are not verified by this table. The wider provider registry's sample IDs are hints, not a support guarantee. Before a release claim or model migration, verify each adapter's request shape, actual account availability, pricing, preflight path, and failure display with controlled keys. Do not silently replace a built-in model with a different one: that changes the match being purchased and compared.
