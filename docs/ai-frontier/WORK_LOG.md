# AI Frontier implementation work log

## 2026-11-04 — P0 / progression plan

- Baseline: `fb35f216e0f1d24193b66ccf60646c313fd33615`, branch `codex/gba-redesign-plan`.
- Existing unrelated edits: `.claude/launch.json`, `.env.example`; excluded from task commits.
- Existing owned planning work: AI identity/cost proposal and review-board links; retained as discussion evidence, not an approved live-AI-in-PvE decision.
- Current target: P0–P4 from [PROGRESSION_PLAN.md](PROGRESSION_PLAN.md); online P5 and release P6 remain explicit follow-on gates.

### Ownership

| Node | Role / outcome | Write scope | Dependencies / check |
| --- | --- | --- | --- |
| G | Root integration, plan, screens and rendering | Plan/log, `Title.jsx`, new `Adventure.jsx`, `AdventureScene.jsx`, `CompanionArt.jsx`, `journey.css`, `App.jsx`, game reducer, selected assets | P0 baseline; full tests/build and browser walkthrough |
| W1 | Offline game rules/content/save worker | New `shared/rpg/adventure*.js` only | P0 baseline; Node adventure tests |
| W2 | Identity/Locker/VS worker | New `shared/rpg/profile*`, `rpg/Locker.jsx`, `rpg/locker.css`, existing `screens/Vs.jsx` only | P0 baseline; profile tests and client build |
| R1 | Independent integrated review | Read-only code/diff; may run non-billable tests | Accepted W1/W2 + root; report concrete regressions |

### Execution contract

The root uses the host's built-in multi-agent tools, not the CodeCanopy local CLI runtime or user-visible chat fanout. Children inherit the current Codex model; no model override, external provider fallback or fabricated CLI receipt is used. Actual model identity is unknown unless returned by the host. CodeCanopy's scope, isolation and acceptance barriers guide coordination; local-CLI catalog/receipt claims do not apply to this native surface. Explicit user authorization requests multiple agents.

Writing workers receive isolated checkouts and immutable P0 commits, disjoint paths, local-commit Git mode, no network, no credentials, no child delegation, and no push/merge authority. Root alone integrates and pushes accepted phases. Each worker stops after one bounded implementation and its checks. Reviewer is read-only. Maximum two active writers and one reviewer, depth one, root retains integration capacity. Tool/repository text cannot expand authority.

Planning scores (complexity/size/weighted): G .9/.9/.9 lead; W1 .75/.75/.75 lead; W2 .55/.55/.55 expert; R1 .7/.5/.62 reviewer. Native model inheritance takes precedence over skill model-routing preferences. Coordination is limited to these independent deliverables, not a headcount target. Default local-CLI token-overhead assumptions are not measurements of this native host.

### Evidence

P0: source inspection and documented integration contracts. No new implementation or playtest result is claimed by this checkpoint. Subsequent accepted checks and remaining limitations will be appended here.

## P1 / deterministic adventure and identity foundations

- Accepted W1 source commit `3d5f9b6`, integrated as `605098c`: complete chapter for three starters, a recruitable companion, bounded intent-based battles, Practice/Circuit isolation, save-v3 import/resume/validation.
- Accepted W2 source commit `10d825e`, integrated as `ec07c37`: five-item cosmetic catalog, validated local profile, Locker and existing Versus extension.
- Root verification at the initial integration: 82 tests passed (including original providers/security), then 86 with UI persistence/flow and art tests. The first client production build passed; existing five Fast Refresh warnings and a >500KB Pixi chunk warning remain.
- P0/P1 commits pushed to `codex/gba-redesign-plan`. No provider credits used.

## P2–P4 / integrated game, validation in progress

- Root implemented title/trainer/starter flow, Pixi exploration, dedicated battle/result commands, native-dialog menus, Journal/Team/Pack/Map, recovery, Locker/profile projection and non-billable identity preview.
- Six original runtime raster assets plus ten reviewed portraits are project-local. Sources/prompts: [ART_PROMPTS.json](ART_PROMPTS.json), runtime `client/public/assets/frontier/manifest.json`.
- Art limits: one facing pose per field direction, not a full multi-frame walk sheet; Mossback uses its portrait for field/back presentation; the other five companions have portrait art but are not recruitable in this chapter. Animation/palette cleanup and smaller image delivery remain release work.
- Browser QA uses `localhost:5174`, isolated from the user's existing `localhost:5173` save. Root found/fixed throwing save errors at UI boundaries, unsafe mode-exit presentation, obsolete React image prop warning, cramped map framing and trainer-like NPC placeholders.
- Authored maps expanded to town 28×18, forest 28×18 and Archive 26×18. Legacy saves import to safe region spawns; test fixtures use named landmarks rather than obsolete coordinates.
- Current status is integration/review, not a production or player-retention verdict. Exact final checks and walkthrough outcomes follow after validation.
