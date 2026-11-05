import { randomBytes, timingSafeEqual } from 'node:crypto';
import { createDuel, expireDuelTurn, submitDuelChoice, PVP_COMPANIONS, PVP_TURN_MS } from '../../shared/rpg/pvp.js';

export class PvpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function identity(input) {
  if (!input || typeof input.trainerName !== 'string' || !input.trainerName.trim() || input.trainerName.trim().length > 24 || /[\p{Cc}\p{Cf}]/u.test(input.trainerName)) {
    throw new PvpError(400, 'Use a trainer name of 1 to 24 visible characters.');
  }
  if (!PVP_COMPANIONS.some(entry => entry.id === input.companionId)) throw new PvpError(400, 'Choose Emberquill, Kitewhisk or Duplet.');
  return { trainerName: input.trainerName.trim(), companionId: input.companionId, token: randomBytes(32).toString('base64url'), left: false, rematch: false };
}

function authorized(room, token) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new PvpError(401, 'Your room pass is missing. Reopen this room in the tab that joined it.');
  const seat = room.players.findIndex(player => player && timingSafeEqual(Buffer.from(player.token), Buffer.from(token)));
  if (seat < 0) throw new PvpError(401, 'This room pass is not valid. Reopen the original tab or create a new room.');
  return seat;
}

function view(room, seat, now) {
  return {
    code: room.code, version: room.version, seat, match: room.match,
    status: room.closed ? 'closed' : !room.duel ? 'waiting' : room.duel.result ? 'finished' : 'active',
    players: room.players.map((player, index) => player ? {
      trainerName: player.trainerName, companionId: player.companionId, left: player.left, rematch: player.rematch,
      ready: Boolean(room.duel?.choices[index]), ...room.duel?.players[index],
    } : null),
    duel: room.duel ? {
      turn: room.duel.turn, history: room.duel.history, result: room.duel.result,
      myChoice: room.duel.choices[seat], deadline: room.deadline,
    } : null,
    serverTime: now,
    expiresAt: Math.min(room.updatedAt + room.idleMs, room.createdAt + room.lifeMs),
  };
}

export function createPvpStore({ now = Date.now, maxRooms = 256, idleMs = 15 * 60_000, lifeMs = 2 * 60 * 60_000 } = {}) {
  // shortcut: rooms live in one process, use a shared store before running multiple instances or keeping rooms through restarts.
  const rooms = new Map();
  function prune() {
    const time = now();
    for (const [code, room] of rooms) if (time >= room.updatedAt + idleMs || time >= room.createdAt + lifeMs) rooms.delete(code);
  }
  function find(code) {
    prune();
    if (typeof code !== 'string' || !/^[A-F0-9]{10}$/.test(code)) throw new PvpError(400, 'Invite codes have 10 letters and numbers. Check the code and try again.');
    const room = rooms.get(code);
    if (!room) throw new PvpError(404, 'This room expired or does not exist. Ask your friend for a fresh invite.');
    if (room.duel && !room.duel.result && now() >= room.deadline) {
      room.duel = expireDuelTurn(room.duel);
      room.version++;
    }
    return room;
  }
  function start(room) {
    room.duel = createDuel();
    room.deadline = now() + PVP_TURN_MS;
    room.match++;
    room.players.forEach(player => { player.rematch = false; });
  }
  return {
    create(input) {
      const player = identity(input);
      prune();
      if (rooms.size >= maxRooms) throw new PvpError(503, 'The Duel Hall is full. Try again after an idle room expires.');
      let code;
      do { code = randomBytes(5).toString('hex').toUpperCase(); } while (rooms.has(code));
      const time = now();
      const room = { code, players: [player, null], version: 1, match: 0, duel: null, closed: false, createdAt: time, updatedAt: time, idleMs, lifeMs };
      rooms.set(code, room);
      return { room: view(room, 0, time), token: player.token };
    },
    join(code, input) {
      const room = find(code);
      if (room.closed || room.players[0].left) throw new PvpError(410, 'The host left this room. Ask for a fresh invite.');
      if (room.players[1]) throw new PvpError(409, 'This room already has two trainers. Create another room to play.');
      const player = identity(input);
      room.players[1] = player;
      room.version++;
      room.updatedAt = now();
      start(room);
      return { room: view(room, 1, now()), token: player.token };
    },
    read(code, token) {
      const room = find(code);
      return view(room, authorized(room, token), now());
    },
    command(code, token, input) {
      const room = find(code);
      const seat = authorized(room, token);
      if (room.players[seat].left || room.closed) throw new PvpError(410, 'You have left this room. Create or join a new room.');
      if (!input || !Number.isSafeInteger(input.version) || input.version !== room.version) throw new PvpError(409, 'The room changed. Refresh the room, then choose again.');
      const player = room.players[seat];
      if (input.type === 'choice') {
        if (!room.duel || room.duel.result) throw new PvpError(409, 'No active turn. Wait for a trainer or request a rematch.');
        const previousTurn = room.duel.turn;
        try { room.duel = submitDuelChoice(room.duel, seat, input.moveId); }
        catch (error) { throw new PvpError(400, error.message); }
        if (room.duel.turn !== previousTurn) room.deadline = now() + PVP_TURN_MS;
      } else if (input.type === 'leave') {
        player.left = true;
        player.rematch = false;
        if (!room.duel) room.closed = true;
        else if (!room.duel.result) room.duel = { ...room.duel, choices: [null, null], result: { winner: 1 - seat, reason: 'forfeit' } };
      } else if (input.type === 'rematch') {
        if (!room.duel?.result) throw new PvpError(409, 'Finish this duel before requesting a rematch.');
        if (room.players.some(entry => entry?.left)) throw new PvpError(410, 'Your opponent left. Create a new invite to play again.');
        if (player.rematch) throw new PvpError(409, 'Rematch already requested. Wait for your opponent.');
        player.rematch = true;
        if (room.players.every(entry => entry.rematch)) start(room);
      } else throw new PvpError(400, 'Unknown action. Refresh the room and try again.');
      room.version++;
      room.updatedAt = now();
      return view(room, seat, now());
    },
  };
}
