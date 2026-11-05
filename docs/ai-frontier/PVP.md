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

- `client/src/rpg/pvp/PvpHall.jsx`: default `PvpHall({ trainerName = '', onExit })`. It never modifies the Journey save. It uses native buttons/forms and an exit-confirmation dialog, pixel fonts and panels, original companion sprites, a Duel Guide, an accessible turn record, and a guarded tab-only session pass.
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
node --test shared/rpg/pvp.test.js server/lib/pvp.test.js server/routes/pvp.test.js client/src/rpg/pvp/session.test.js
```

They cover simultaneous resolution, hidden choices, forged stats, invalid/duplicate/unauthorized/stale commands, double knockout, turn-cap ties, deadline outcomes, forfeit, mutually consented rematches, reconnect reads, room expiry/capacity, actual HTTP flow, polling limits, malformed/oversized JSON and guarded tab-session/share-link behavior. Root integration owns full app build/lint and browser checks at 320/390/1280, including two independent browser seats.
