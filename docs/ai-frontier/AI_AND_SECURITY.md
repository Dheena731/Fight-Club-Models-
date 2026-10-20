# Real AI challenges, credentials, and shared play

## Current boundary versus target

The current live arena sends user-supplied keys from React through Express to provider adapters and streams battle events over SSE. The server has no database for credentials. Keys now stay in memory and old browser-stored copies are removed on boot. The round engine stops subsequent calls when the stream client disconnects and propagates a cancellation signal to adapters, but a request already accepted by a provider may still be charged. Two model-judge scores remain subjective. These changes are not a complete security guarantee. Offline exploration and RPG combat do not use the live-model path.

## Credential lifecycle for Phase 4

1. Player chooses a supported provider and compatible model in the arena. Check current provider documentation and maintain an allowlisted model registry; do not treat illustrative ids in the existing registry as proof of availability.
2. Explain that calls use the player's provider account and may incur charges. Before each billable challenge, show its maximum call count, round/task budget, and cancellation behavior. Any estimate must be labeled and based on current pricing and measured usage.
3. Accept a masked key into React memory only. The memory owner is an arena connection context, never world state, save state, replay, analytics, or a URL. Clear references on disconnect, leaving the arena, and page unload. Reload never reconnects automatically.
4. Use an officially supported direct-browser integration only where appropriate; otherwise use the existing narrow Express proxy. Disclose that a proxied key reaches the game's server for the duration of the authorized request. Neither route makes the user's browser memory a perfect security boundary.
5. Migrate prior users by deleting the old `aba:provider-keys` local and session entries without reading or re-saving their values. Explain once that reconnection is required. Do not introduce a replacement persistent credential mechanism.
6. Explicit disconnect clears in-memory key references and active requests. Public result records contain redacted provider/model identifiers and task metadata, never credentials or private prompt text.

## Request path hardening

- Server accepts only known providers/models and challenge versions; no arbitrary client-supplied base URL in public deployment. Resolve URLs from trusted server configuration and block redirects to untrusted/private destinations.
- Validate size, type, number of rounds, output-token cap, and cumulative request budget before any provider call. Apply per-request deadlines and propagate `AbortSignal` through adapters. Stop work when the SSE client disconnects.
- Bound response bytes and sanitize provider output before display or reuse. Distinguish success, refusal, timeout, quota failure, cancellation, and judge failure; none becomes a fabricated response or draw.
- Return safe, stable error codes. Do not expose raw SDK/provider exceptions to clients or logs; those may include request details. Log request id, provider id, timing, and safe status only. Explicitly exclude key and prompt fields from telemetry.
- Apply strict CORS for configured origins, suitable CSP and browser security headers, TLS in hosted deployment, rate limiting, dependency review, and CSRF protection if future auth uses cookies.
- Audit any replay/share code: the present hash encodes a full result, so public sharing must be deliberate, size-bounded, sanitized, and incapable of carrying credentials or private input. Call it a recap until actual replay playback exists.

## Scoring contract

Maintain separate result types:

```text
RPGResult       = fictional combat rules and deterministic rewards
ArenaShowResult = real model outputs, subjective entertainment judging
ChallengeResult = real model outputs, versioned task, reproducible scoring
```

For a comparable challenge, both models receive identical versioned input and evaluation criteria. Record task id/version, scoring implementation version, provider and actual model identifier, relevant parameters, observed latency and usage where available, timestamp, and completion status. Deterministic tests should score structured extraction, coding, or objective reasoning where feasible. Human/model judges can accompany a result, clearly labeled as subjective; they do not turn a small challenge set into a global model ranking. A partial, refused, timed-out, or incompatible output is reported as such.

The existing Roast/Injection/Impersonation modes need mode-specific rules and honest result language before being compared. In particular, the current shared wit/creativity/burns rubric does not evaluate injection resistance or imitation fidelity. Keep those modes as entertainment until scoring is designed and tested.

## Multiplayer authority and privacy (Phase 5)

Begin with a single room, two users, and server-owned positions/presence. Define an explicit protocol for join, intent, validated state update, acknowledgement, disconnect, and reconnect; include version and monotonic sequence numbers. The server owns room membership, legal movement, encounter state, quest eligibility, rewards, and competition results. Clients may render prediction but cannot declare success. Add message size and rate limits and test simultaneous actions and stale/replayed intents.

Competitive API calls require an authorization from the owner for the specific task and budget. A room message never contains credentials, private prompts, or raw private provider responses. Each participant's key is confined to their own authorized request. Shared challenge results are sanitized and published only according to explicit player choice. Do not add chat until moderation, abuse controls, and data retention are designed.

## Acceptance tests before public release

- A page reload does not restore an entered key; disconnect clears application references and cancels the request.
- A save, replay URL, profile DTO, match DTO, room message, error response, and log record contain no credential.
- Unsupported provider/model, task version, and custom outbound URL are rejected before a provider call.
- Round/token/call budgets and body/response size limits are enforced server-side.
- Browser abort and server deadline stop downstream calls where provider SDKs support cancellation; any unavoidable residual call is disclosed and measured.
- A failed provider or judge results in an incomplete match, not a score invented as success.
- Two multiplayer clients cannot award themselves XP, alter the other player's state, or trigger calls with the other player's key.

Security acceptance requires tests of the actual client-to-server-to-adapter path with safe fake providers, plus a separately authorized real-provider smoke test. This plan does not claim the present implementation passes those tests.
