---
version: 1
slug: "client-src-rpg-journeytitle-jsx"
primary_target: "client/src/rpg/JourneyTitle.jsx"
related_targets: ["client/src/rpg/Adventure.jsx"]
---

# Portable saves

Status: implemented after upstream Cogimon polish (`6a21df1`); verification evidence is recorded in WORK_LOG.md.

## Scope

Players can download a local JSON backup and preview a restore from the title screen. The default includes the saved Journey, local Locker and best Circuit record. A Journey-only backup leaves the other two records untouched. No upload, account, provider key, arena transcript or browser-wide storage export is involved. All cosmetics remain local and unverified.

Restore is title-only: an active battle is never replaced in memory. Invalid, oversized and unsupported files do not write anything. Confirmation checks the storage snapshot again, allocates a new Journey run identity to reject old-tab autosaves, verifies every write and attempts rollback on failure. localStorage cannot provide a cross-tab transaction; a failed rollback must be reported explicitly, not described as success.

## Direction contract

THESIS: protect a player's companion adventure through a readable preview-before-replace ritual, not an account dashboard.

OWN-WORLD: inherit Cogimon's existing warm GBA dialogue frames, ink, cloud and jade primary buttons. No new palette, illustration, font or design-system change.

STORY: open Save Data, download a backup or choose a local file, inspect the trainer, companion, region and included records, then cancel or explicitly restore. Successful restore returns to the refreshed title menu.

FIRST VIEWPORT: the existing native game dialogue holds a short privacy explanation, two named actions and status text. File selection replaces that content with a compact companion portrait and a definition list; replacement warning sits immediately before the confirm/cancel controls. Stack naturally on phones.

FORM: narrow Operate extension of the established title and game menus; code-led, no direction roll applies. seed: none (unavailable).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Verification

- Unit tests: round trips, old-save migration, mode isolation, allowlisted data, malformed/version/size failures, unchanged data on cancellation, replacement races, write verification, rollback and fresh run IDs.
- Browser: empty state, download, invalid-file recovery, preview/cancel/restore, reload, Locker persistence, title/game-menu navigation, desktop and narrow viewport, keyboard focus. No paid AI calls.
- Preserve incumbent DESIGN.md and raster provenance; no new raster assets ship.

## Remaining boundaries

Backups are editable local data, not server-verified achievements. Cloud synchronization, verified profiles and human matchmaking still require the separate online architecture decision. Physical controllers, real phones and sustained frame-time profiling are not implied by browser viewport testing.
