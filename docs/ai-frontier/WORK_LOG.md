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

## 2026-11-05 — GBA movement and story-led exploration

### Branch and preservation

Continued `codex/gba-redesign-plan` at `12fa7ea` after fetching and pulling with fast-forward-only; the remote was already current. Earlier Phase 2 changes remain preserved in `codex/backup-pre-gba-20261105` and stash `d72d396bd777b6a6028cfc26554c7328c7c73c5a`. Only the dependency/CI fixes and approved Impeccable 4.8 tooling update were carried over. Legacy World/WorldScene gameplay was not overlaid onto the active Adventure implementation.

### Implemented

- Held keyboard and captured touch movement now use a deterministic clock: 180ms walking, 105ms running. Shift and an accessible Run toggle share the same controller. Overlays, blur, hidden tabs, mode changes and region transitions clear held input; delayed frames cannot accumulate steps.
- The existing directional artwork now has alternating foot placement and torso weight transfer, grounded shadows and bounded footprints. Companions follow the accepted cardinal trail through corners and begin on a walkable neighboring tile. Authored crops for all 16 field poses remove neighboring-pose fragments without changing character scale or source images; actual boot baselines align with the ground. Camera clamping, reduced motion and paused rendering are explicit. No new graphics dependency or raster asset was added.
- Sunward Pass adds a connected 36×24 optional route after the Wisp, Sela’s clue/recovery/return quest, a one-time supply reward and Lantern Overlook discovery. Its map marker and coordinates appear after discovery; browser checks confirm the landmark list changes from five to six. Main objectives remain separate. Existing saves receive only the complete new schema defaults; partial new records still fail validation. The new passable gateway preserves old tile positions.
- [WORLD_AND_STORY.md](WORLD_AND_STORY.md) records the playable chapter, character stakes, optional loop and proposed later acts. Later acts are explicitly unimplemented.
- Updated dependency locks and lint compatibility run on Node 24. The new CI workflow specifies clean installs, checks and audits on Windows/Linux; hosted CI has not run in this session.

### Local evidence

- `npm run check`: **111/111 tests passed**, lint **0 errors / 6 Fast Refresh warnings**, production build passed. The warnings concern existing mixed exports; the Pixi chunk remains **555.68KB / 162.81KB gzip**, above Vite’s 500KB warning threshold.
- `npm run audit`: **0 vulnerabilities** in both dependency trees. Root and client dependency lists are valid after clean installation.
- Isolated Chrome QA at `127.0.0.1:15173` covered new Journey setup, walk/run cadence (4 vs 6 tiles in 650ms), stopping, wall collision, Journal/blur interruption, actual Sunward gateway travel, lens return/dialogue/save persistence, map landmarks, touch hold/release and a static reduced-motion idle frame.
- Viewports inspected: 1280×800, 390×844, 320×740 and 844×390. Movement/action controls are at least 44×44px; inspected layouts and the scrollable map dialog have no horizontal overflow. Browser inspection also checked actual foot offsets, a cardinal follower trail, separate arrival positions, all four trainer facings and all four available companion presentations.
- No page errors, failed requests or live provider calls occurred in the completed smoke pass. Reproduction script, JSON report and screenshots are local ignored artifacts under `.cache/gba-smoke.mjs` and `.cache/qa/gba/`; automated command output is `.cache/gba-final-check.txt`.

This is a playable chapter extension, not a completed large open world. Physical-device performance, bespoke multi-frame character sheets, observed player sessions, later chapters and online multiplayer remain future work. Changes have not been committed or pushed.

## 2026-11-05 — Current chapter release polish

### Delivered

- Game/theme/stage context hooks now live outside component modules, clearing the Fast Refresh warnings without disabling lint rules. Generated client cache output is ignored alongside `dist`; source lint coverage remains enabled.
- Removed the aggregate Pixi manual chunk so its WebGL, WebGPU and Canvas renderers retain their lazy imports. The largest production JavaScript chunk is now **370.05KB / 118.01KB gzip**, below Vite's unchanged 500KB warning threshold. This describes the largest chunk, not total application transfer.
- Six atlases/panorama and ten portraits now load from exact lossless WebP derivatives. Source PNGs and prompts remain intact. All 16 derivatives preserve decoded RGBA pixels, alpha and dimensions; the manifest records source/runtime hashes and encoder details. Their combined runtime transfer falls from **22,267,439 to 16,910,260 bytes**, saving **5,357,179 bytes (24.06%)**. Retaining originals increases the deployed public directory; this is a runtime network saving, not a smaller deployment directory.
- Browser-standard gamepads support field movement, run, interaction, menu and native-control navigation/confirmation. Held movement clears on blur, hidden tabs, disconnection and cleanup; region/pause changes reissue held movement without replaying face-button actions. Nonstandard controller mappings remain unsupported.
- Battle entry focuses its heading; native-dialog cleanup restores a usable focus target. Modified/composing keyboard input no longer triggers adventure controls. Mobile action feedback stays visible, and inspected HUD/movement/action controls meet 44-by-44-pixel targets even at 320px width.
- Failed lazy imports/rendering show a reload recovery screen without clearing saves. Scene artwork failures expose accessible, readable retry/reload actions. A controlled missing-chunk check reached the recovery screen; restoring the chunk and reloading returned to Practice.

### Validation and scope

- Exported the exact staged release source to `.cache/cogimon-release-candidate`, excluding the concurrent world/traversal/audio expansion. `npm run check`: **122/122 tests passed**, lint **0 errors / 0 warnings**, and production build passed without chunk-size warnings. Ten focused gamepad tests cover deadzones, repeat bounds, modal/form routing, controller/context transitions and cleanup. Asset tests verify the WebP containers, dimensions and source/runtime hashes; a separate Pillow check compared every decoded pixel.
- Final copy and touch-target adjustments were followed by clean candidate lint/build checks. `git diff --cached --check` passed. Local command evidence: `.cache/cogimon-candidate-check.log`; pixel comparison: `.cache/artwork-lossless-report.json`.
- Isolated production preview at `127.0.0.1:15177`: title/starter portraits, Kitewhisk Journey and Pixi exploration loaded; Practice focused its enemy heading; Ctrl+Right preserved position while Right moved. Reload/Continue retained column 13, row 11 and companion HP 32/32. Journal dismissal restored focus to its opener. At 390x844 and 320x740, inspected layouts had no horizontal overflow and action feedback stayed visible. Header and field controls were at least 44x44px after the final adjustment.
- The first arena check correctly reported an unavailable local API. Starting the isolated candidate server restored the roster; the arena renderer initialized and World return preserved Journey position/progression. No credentials were entered and no live provider calls were made. Final release-origin inspection reported no console warnings/errors; earlier missing-chunk fault-test logs belong to the separate `15176` preview. Screenshot: `.cache/qa/release-polish/desktop.jpg`.
- The separately approved connected-world expansion remains unstaged and is not part of this release-polish checkpoint. Its edits and work-log evidence were preserved. No dependency or save-key change was required here.

Physical phone/controller checks, screen-reader testing, target-device frame/memory profiling, soundtrack and complete companion animation/back-art sets remain open. P5 multiplayer/verified profiles and P6's distinct second-world/player validation are not complete. At least five observed new-player sessions are still needed before drawing enjoyment or retention conclusions.

## 2026-11-05 — Portable Journey and Locker backups

### Sync and scope

- Fast-forward pulled `codex/gba-redesign-plan` from `12fa7ea` to `6a21df1` (six upstream commits). Preserved the existing `.claude/launch.json` and `.env.example` working-tree edits. No account, hosting or paid-service changes.
- User confirmed Journey + Locker backups. Added `shared/rpg/saveBackup.js` for a version-1, allowlisted Cogimon envelope, plus `SaveDataPanel.jsx` within the existing GBA dialogue system. Title: Field Guide → Save Data. In-game: menu → Save Data for export; restore is deliberately title-only.
- Export includes the protected Journey rather than disposable Practice/Circuit combat, normalized local Locker and best Circuit record. Credentials, model text, arbitrary storage, settings and transient UI state are excluded. Internal support for a Journey-only envelope leaves the other records untouched.
- Import enforces a 256 KB UTF-8 limit, validates/migrates the Journey, sanitizes catalog IDs, previews without writing and requires explicit replacement. The confirmation checks every relevant stored value against its preview. Restore generates a fresh run ID, verifies all writes and attempts rollback on failure, with a distinct warning if recovery is incomplete. Higher Circuit records and legacy keys are preserved. localStorage is not a cross-tab database transaction.
- Stale Journey autosaves no longer synchronize an old Locker after the Journey write fails. Manual equipment and retry writes also require the original stored Journey identity, including title Practice with no nested Journey. A Practice backup falling back to storage uses the matching stored Locker, not its cached identity. Existing art, palette and typography are inherited; no new raster asset or durable design-system change.

### Validation

- Final Linux Node 24 `npm run check`: **146/146 tests passed**, lint **0 errors / 0 warnings**, production build passed without chunk-size warnings. Root/client `npm run audit`: **0 vulnerabilities**. Twenty-four new tests cover the backup boundary and stale-profile guard; targeted Windows Node 24 tests also passed **27/27**, including the three existing storage tests. Command evidence: `.cache/cogimon-save-data-check.log`.
- Isolated browser origin `localhost:5186`: empty-save export error; real JSON download verified as Journey + Locker with local verification; unsupported file rejection; preview and cancellation; replacement of a different named Journey; reload/Continue; restored Kitewhisk/Locker identity. An older open game tab attempted movement after a second tab restored the same backup and correctly showed save rejection.
- Keyboard focus lands on Cancel for preview and returns to the file picker on cancellation. Final 1440×900, 390×844 and user 1280×720 captures showed the loaded companion portrait and no horizontal overflow. The final tab had no captured console warnings/errors. Screenshots are local-only in `.impeccable/review/`; source contract is tracked in `.impeccable/surfaces/`.
- Final production-build regression used a synthetic, local/unverified badge fixture in the isolated QA origin. After another tab restored the clean backup, the older Locker's Pin action was rejected and the restored identity still showed the badge locked. The failed action now announces “Equipment unchanged” rather than falsely reporting a pin. Evidence: `.impeccable/review/stale-locker-rejected.jpg`. All QA tabs were closed, viewport overrides reset and owned preview servers stopped.
- A WSL service startup timeout delayed the final recheck; it recovered without a restart or distro termination. An isolated Windows source snapshot was prepared without the two original dirty settings files, but the bundled Windows Node lacked npm, so no full Windows install/build is claimed. Final full checks resumed successfully in the original Linux environment. No dependency or lockfile changes were needed.
- The independent finish review found one stale manual Locker-write issue; five new storage regressions and a shared identity guard address it. Its final **ship** verdict pass scored both that safety issue and directly related false-success feedback **resolved**, with no fix-induced regression in the four final captures. That verdict covers the two scored fixes, not a whole-product audit. A separate static documenter confirmed the addition inherits the incumbent GBA system, with no global design-file changes. Only our new brief's incorrect “amber buttons” wording was corrected to match the existing jade actions; pre-existing arena-focused DESIGN.md sections were preserved.

No provider credentials were entered or paid AI calls made. Backups remain editable, local and unverified. Cloud sync, verified profiles, human matchmaking, physical-device checks and measured performance remain separate work.
