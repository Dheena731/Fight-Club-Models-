# Cogimon friend duels

The Duel Hall is a real two-human, unranked invite mode. Each trainer chooses Emberquill, Kitewhisk or Duplet and controls that companion from their own browser or device. It is separate from local Adventure encounters and the optional BYOK model arena. It makes no provider calls and grants no Journey rewards.

## Playing

1. Enter the Duel Hall from the title or Journey menu. Pick a trainer name and companion, then open an invite room.
2. Send the code or invite link to one friend. Both devices must reach the **same running game server**. A localhost link only works on the computer hosting it; remote play needs a reachable deployment with the frontend origin allowed by the existing server CORS configuration. No public deployment is created by this change.
3. The friend opens the link and joins with a name and companion. Keep the room pass in the joining tab; the share link contains only an invite code.
4. Each trainer locks one move. Choices stay secret until both lock, then both moves resolve simultaneously. Locked choices cannot change.
5. After a result, both trainers must request a rematch. Leaving an active duel forfeits it. Reopening the Hall in the same tab resumes the seat, including after a refresh.

An invite code admits one guest, so share it only with the intended opponent. Trainer names are self-chosen, not verified identities. There are no accounts, matchmaking, rankings, moderation tools or public leaderboards.

## Fixed rules

All three companions use the same server-derived stats and kit: **40 HP, 6 maximum energy, 3 starting energy**. Appearance is the only companion difference in this first slice. Journey levels, local save edits, items and cosmetics do not affect combat.

| Move | Cost | Damage | Block this turn | Restore energy |
|---|---:|---:|---:|---:|
| Signal Strike | 0 | 8 | 0 | 1 |
| Ward | 0 | 2 | 10 | 2 |
| Overcharge | 3 | 17 | 0 | 0 |

Block reduces incoming damage, down to zero. Both hits and energy changes apply together. Simultaneous knockouts draw. A duel lasts at most 20 turns; remaining HP decides at the cap, with equal HP drawing.

Each turn has a two-minute server deadline. If one trainer has locked a choice, that trainer wins on timeout; if neither has locked, the duel draws. Disconnects do not pause time. Deadline resolution occurs on the next room read or command. A new turn gets a fresh deadline. Both trainers must consent before a rematch resets HP, energy, choices, history and the turn clock.

## Integration contract

### Battle presentation

The Hall extends the original Cogimon warm GBA system into a compact Pokémon-style battle screen. The header stays compact, and the room invite strip is hidden during combat. Species names lead slim, angled cream HP and energy plates. The opponent is a smaller, distant, front-facing sprite; your larger, square-proportioned, back-facing companion is cropped into the foreground. Original Cogimon art, plum outlines and jade terrain stay aligned with Journey.

The battlefield sits above an integrated teal dialogue panel and cream 2×2 command menu: **Fight**, **Record**, **Guide** and **Leave**. Fight opens the three real moves and Back; the selected move shows its stats. Arrow keys move the native-button focus cursor, Enter activates, and Escape returns from the move menu. Guide and Record open dialogs. During playback, the header shows the resolving turn and **Resolving**; the next turn and countdown appear when selection resumes. Guide and turn details are available on demand.

Newly revealed turns play in a 2.05-second sequence:

| Beat | Duration | Feedback |
|---|---:|---|
| Reveal | 550 ms | Both completed move choices appear in the dialogue. |
| Action | 550 ms | Signal Strike lunges, Ward raises a barrier, and Overcharge sends an energy pulse across the field. |
| Impact | 650 ms | Actual damage triggers a hit reaction and HP drain; a complete block keeps its barrier and shows “Blocked.” |
| Settle | 300 ms | Knocked-out companions faint before the result and rematch controls appear. |

Moves still resolve simultaneously on the server. The client delays only their presentation and disables move selection during playback. The next turn's server deadline continues running. `playback.js` queues unseen completed history entries using the room code and match number; repeated polls do not replay a turn, initial reconnection shows the current settled state, and a rematch clears the old sequence. HP and damage always come from server history. Energy presentation uses the shared move costs and recovery values while catching up across several turns. The battlefield-relative energy projectile travels to the opponent; Ward, hit and faint feedback reflect the resolved result. Unrevealed opponent choices are never used.

Reduced motion retains move narration, barrier, damage labels, HP values and result while removing travel, shaking and floating movement. The layout is checked at 320×568, 390×844, 844×390 and 1280×800. Timeout and forfeit results without a newly completed turn do not invent an attack.

### Project boundaries

The project has three independent combat paths: local Journey/Practice/Circuit in `shared/rpg/adventure.js`, human invite duels in `shared/rpg/pvp.js`, and the optional provider-backed model arena in `server/lib/battle.js`. This presentation work belongs to human duels. Local combat has item, switch and enemy-intent turns that need their own presentation events before it can use similarly accurate animation, particularly on the final hit. Sharing its reducer or progression with invite duels would change gameplay and save behavior.

- `client/src/rpg/pvp/PvpHall.jsx`: default `PvpHall({ trainerName = '', onExit })`. It never modifies the Journey save. It uses native buttons/forms and dialogs, pixel fonts and panels, original companion sprites, an on-demand Duel Guide and turn record, and a guarded tab-only session pass.
- Mount the default router from `server/routes/pvp.js` at `/api/pvp` **before** the legacy `/api` 20/minute limiter and global JSON parser. It has its own 2 KB JSON limit and per-IP limits: 180 reads/minute, 120 commands/minute and 20 combined creates/joins/minute. Two tabs polling every two seconds use 60 reads/minute together.
- `createPvpRouter({ store, limits })` supports an isolated store and disabling limits for focused tests. Production defaults keep limits enabled.
- `shared/rpg/pvp.js` holds the normalized rule engine. `server/lib/pvp.js` owns room seats, passes, authorization, versioning, deadlines and expiry.
- A share link uses `#duel=CODE`, read through `client/src/lib/duelInvite.js`. It contains no bearer pass or old query string. The root app selects the Hall at startup and clears this hash on return.

## HTTP

| Method | Path under `/api/pvp` | Input | Response |
|---|---|---|---|
| POST | `/rooms` | `trainerName`, `companionId` | `{ room, token }` for host |
| POST | `/rooms/:code/join` | `trainerName`, `companionId` | `{ room, token }` for guest |
| GET | `/rooms/:code` | Bearer token header | Authorized room view |
| POST | `/rooms/:code/command` | Bearer token; `version`, `type` and optional `moveId` | Updated authorized room view |

Command types are `choice`, `rematch` and `leave`. The server derives the seat from the bearer pass; a client cannot nominate an opponent seat. Mutations require the current integer version. A stale request returns 409, and the client refreshes read-only state before the trainer acts again; it never silently resubmits a move. Duplicate locked moves and rematch requests are rejected. Poll responses cannot overwrite a newer version in the client.

Room views have the viewer's seat, connection-independent readiness flags, normalized HP/energy, their **own** pending move, and revealed completed turns. The opponent's pending move and both bearer passes are excluded. Bearer passes are independently generated 256-bit random values; codes are 40-bit random uppercase hex. No pass is placed in a URL, share output or log. Responses use `Cache-Control: no-store`.

Tab session storage is guarded against blocked/unavailable storage. With storage blocked, the seat works until the page is reloaded and the UI explains that limit. A copied/duplicated tab may inherit the same browser tab session and therefore resumes the same seat; use a separate browser context/device for the second human. On network failures, polling retries and actions are disabled until connected. The exit dialog can return while retaining the room pass if the server is unreachable; the duel clock still runs.

## Deployment limits

The room store is intentionally in memory in a **single Node process**. Restarting the process loses every room. Multiple instances require a shared authoritative store and coordinated mutations before deployment. Do not run this slice behind non-sticky multi-instance routing and describe it as reliable multiplayer.

Storage is capped at 256 rooms. Rooms expire after 15 minutes without a successful room action, or after two hours total. Reads do not renew either lifetime. Expired rooms are pruned on subsequent access, so there are no per-room background timers or idle connections. Completed histories are bounded at 20 turns per room. A lost create/join response can leave an unused seat until expiry; it never grants another caller that seat's pass.

The Hall trusts bearer possession, not a verified human identity. It prevents client stat edits, unauthorized seat commands and peeking through the provided room API; it does not prevent two people sharing a pass, collusion, automation or someone with a deliberately shared invite taking the guest slot. Keep the existing HTTPS/deployment/origin controls when hosting it publicly. The move numbers have deterministic tests, not a completed player balance study.

## Verification

Focused engine, store, HTTP and tab-session tests:

```powershell
node --test shared/rpg/pvp.test.js server/lib/pvp.test.js server/routes/pvp.test.js client/src/rpg/pvp/session.test.js client/src/rpg/pvp/playback.test.js
```

They cover simultaneous resolution, hidden choices, forged stats, invalid/duplicate/unauthorized/stale commands, double knockout, turn-cap ties, deadline outcomes, forfeit, mutually consented rematches, reconnect reads, room expiry/capacity, actual HTTP flow, polling limits, malformed/oversized JSON and guarded tab-session/share-link behavior. Root integration owns full app build/lint and browser checks at 320×568, 390×844, 844×390 and 1280×800, including two independent browser seats.
