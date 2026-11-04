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

## Accepted local checkpoint — P0–P4

### Independent review and corrections

The independent reviewer found three initial issues: map upgrades invalidated old v3 positions, Circuit records were not saved at completion, and an old tab could overwrite a replacement Journey. Root corrected these with map revision migration (including active encounter adjacency), stable run IDs/explicit replacement, and a separate Circuit record. Four regression tests cover those reproductions.

The follow-up found that Circuit's Retry Save selected the Journey writer and was inaccessible behind a native result dialog. The retry now selects the appropriate mode writer; recovery controls render inside the active dialog. A quota-failure/restored-storage regression proves the Circuit retry leaves the Journey snapshot unchanged. The reviewer did not issue a final blanket approval after this last correction; root acceptance is based on the targeted regression and integrated checks.

Additional QA corrections: recent battle logs replace stale opening text, attack/impact motion respects reduced motion, NPCs have distinct original artwork, rest/route layouts are authored, the field map shows actual paths/player/landmarks, both tonic and tea have validated targets, and noncritical theme/audio preferences cannot crash boot when storage is blocked.

### Final local checks

- `npm test`: **93/93 passed**, including original provider/cancellation/security checks, all starters with/without recruitment, complete chapter traversal, stable-turn save/resume, migration/corruption, mode isolation, cosmetic ownership, art hashes and recovery regressions.
- `npm --prefix client run lint`: **0 errors**, five pre-existing Fast Refresh warnings.
- `npm --prefix client run build`: **passed**. Pixi chunk remains 555.51KB (162.26KB gzip), triggering Vite's >500KB warning. Image compression and target-device profiling are not completed release gates.
- `git diff --check`: passed at checkpoints; user-owned `.claude/launch.json` and `.env.example` remain excluded.

### Observed browser walkthrough (isolated QA origin)

- Trainer/starter setup and explicit replacement protection; town/forest/Archive navigation; readable dialogue and named destinations.
- Static Wisp turn/energy/HP feedback; refresh resumes exact turn 3, enemy HP 11/30, companion HP 36/36 and energy 4/5.
- Recruited team visible; lead switches both ways. Rest checkpoint and Archive clue work. Wrong lamp resets; correct amber/cyan order restores relay.
- Archive Warden defeated through intent/energy decisions; homecoming displays all three Lantern rewards and a direct Equip path.
- Locker equips frame/title/three badges; preview labels example rival and local/unverified identity. Equipment persists through refresh and mode changes.
- Journey-entered Practice retreats and returns without XP/reward changes. Title-entered Practice has no misleading Return to Journey action that could replace a different save.
- All three Circuit rivals cleared; refresh returns to the protected level-5 Journey and displays the separate **3/3** record.
- Actual field map and tonic/tea targets inspected at phone size. Invalid full-health/full-energy targets disabled; quantities and HP/energy update correctly.
- Optional arena consent → keyless model selection → World return preserves position/progression. No credentials entered and no billable provider calls made.
- Responsive spot checks include 360×740, 390×844 and 1280×720; no horizontal overflow observed in inspected screens. These are browser viewport checks, not physical-phone, gamepad, accessibility-assistive-device or exhaustive screen-combination certification.

### Remaining work, not claimed complete

P5 server-verified profiles/achievements and actual two-human invite duels; P6 mechanically different second world and observed player sessions. Full nine-companion gameplay/animation sets, bespoke back art for Mossback, compressed art delivery, soundtrack, target-device frame/memory measurements and release accessibility testing also remain. No market-fit, production scalability or ranked-fairness claim follows from the local tests.

All agent work was integrated into the original checkout. Temporary managed agent checkouts were retained because the host archive helper reported an ownership conflict; no forced deletion or ownership override was attempted. Temporary ownership exceptions added solely to attempt archival were removed.
