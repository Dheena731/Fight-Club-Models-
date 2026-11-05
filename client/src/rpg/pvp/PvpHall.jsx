import { useEffect, useRef, useState } from 'react';
import { PVP_COMPANIONS, PVP_MOVES, PVP_HP, PVP_ENERGY, PVP_MAX_TURNS } from '../../../../shared/rpg/pvp.js';
import { readDuelInvite } from '../../lib/duelInvite.js';
import CompanionArt from '../CompanionArt.jsx';
import { duelSecondsLeft, duelShareLink, pvpRequest, readPvpSession, writePvpSession } from './session.js';
import './pvp.css';

const companionName = id => PVP_COMPANIONS.find(entry => entry.id === id)?.name || 'Companion';
const moveName = id => PVP_MOVES.find(entry => entry.id === id)?.name || 'Waiting';
function tabStorage() { try { return window.sessionStorage; } catch { return null; } }

function LeaveDialog({ active, busy, offline, onClose, onLeave, onReturn }) {
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const element = dialog.current;
    element.showModal();
    return () => { element.close(); if (previous?.isConnected) previous.focus(); };
  }, []);
  return <dialog ref={dialog} className="pvp-hall pvp-leave-dialog" aria-labelledby="pvp-leave-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <h2 id="pvp-leave-title">Leave the Duel Hall?</h2>
    <p>{active ? 'Leaving now forfeits this duel. Your friend will see the result.' : 'This closes your seat. You will need a new invite to play again.'}</p>
    <p>Your Journey and companions stay just as you left them.</p>
    {offline && <p>The room signal is down. You can return and keep your room pass instead; the turn clock keeps running.</p>}
    <div className="pvp-actions">
      <button type="button" disabled={busy} onClick={onClose} autoFocus>Stay here</button>
      <button type="button" className="pvp-danger" disabled={busy} onClick={onLeave}>{busy ? 'Leaving…' : active ? 'Forfeit & leave' : 'Leave room'}</button>
      {offline && <button type="button" disabled={busy} onClick={onReturn}>Return & keep room pass</button>}
    </div>
  </dialog>;
}

function DuelGuide() {
  return <details className="pvp-guide">
    <summary>Duel Guide</summary>
    <div>
      <p>Invite one real trainer. Both of you choose a move in secret each turn. Choices lock immediately; both moves land together once both trainers have chosen.</p>
      <dl>{PVP_MOVES.map(move => <div key={move.id}><dt>{move.name} · {move.cost} energy</dt><dd>{move.description}</dd></div>)}</dl>
      <p>All three companions have the same moves, 40 HP and 6 maximum energy. Each duel starts with 3 energy. Journey levels, saves, badges and provider keys give no advantage.</p>
      <p>Each turn lasts 2 minutes. If only one trainer has locked a choice, that trainer wins when time runs out. If neither has chosen, the duel draws. Disconnecting does not pause the clock; reopen this tab to reconnect.</p>
      <p>At 0 HP, a companion is out. Two knockouts together draw. After {PVP_MAX_TURNS} turns, higher remaining HP wins; equal HP draws. Rematches start only when both trainers agree.</p>
      <p>These are unranked friend duels. There are no public ratings or Journey rewards. Rooms expire after 15 minutes without a room action, or 2 hours total. Refreshing does not extend them. Server restarts close all rooms.</p>
    </div>
  </details>;
}

function Fighter({ player, self, active }) {
  return <section className={`pvp-fighter${self ? ' is-self' : ''}`} aria-label={`${self ? 'Your' : 'Opponent'} companion`}>
    <div className="pvp-fighter-name"><strong>{player.trainerName}{self ? ' · You' : ''}</strong><span>{companionName(player.companionId)}</span></div>
    <label className="pvp-hp"><span>HP <b>{player.hp} / {PVP_HP}</b></span><meter value={player.hp} min="0" max={PVP_HP} aria-label={`${companionName(player.companionId)} HP`} /></label>
    <div className="pvp-energy"><span>Energy {player.energy} / {PVP_ENERGY}</span><div aria-hidden="true">{Array.from({ length: PVP_ENERGY }, (_, index) => <i key={index} className={index < player.energy ? 'is-filled' : ''} />)}</div></div>
    <CompanionArt id={player.companionId} variant={self ? 'back' : 'front'} />
    <p className="pvp-ready">{player.left ? 'Trainer left' : !active ? 'Duel complete' : player.ready ? 'Choice locked' : 'Choosing a move'}</p>
  </section>;
}

function resultText(room) {
  const result = room.duel.result;
  const victor = result.winner === null ? 'A draw!' : result.winner === room.seat ? 'You won the duel!' : `${room.players[result.winner].trainerName} won!`;
  const reason = { knockout: 'Both moves landed together.', 'turn-limit': 'Turn limit reached. Remaining HP decides the result.', timeout: 'The turn clock ran out.', forfeit: 'A trainer left the duel.' }[result.reason];
  return `${victor} ${reason}`;
}

export default function PvpHall({ trainerName = '', onExit }) {
  const invite = readDuelInvite(window.location.hash);
  const [session, setSession] = useState(() => readPvpSession(tabStorage(), invite));
  const [room, setRoom] = useState(null);
  const [name, setName] = useState(trainerName || 'Traveler');
  const [companion, setCompanion] = useState('emberquill');
  const [code, setCode] = useState(invite || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pollError, setPollError] = useState('');
  const [notice, setNotice] = useState('');
  const [connection, setConnection] = useState(session ? 'connecting' : 'idle');
  const [leaving, setLeaving] = useState(false);
  const [clock, setClock] = useState(Date.now);
  const action = useRef(null);
  const mounted = useRef(true);
  const heading = useRef(null);
  const roomRef = useRef(null);
  const turnHeading = useRef(null);
  const resultHeading = useRef(null);

  useEffect(() => {
    if (room?.status === 'active') turnHeading.current?.focus();
    else if (room?.status === 'finished') resultHeading.current?.focus();
  }, [room?.status]);

  useEffect(() => {
    mounted.current = true;
    heading.current?.focus({ preventScroll: true });
    return () => { mounted.current = false; action.current?.abort(); };
  }, []);

  function acceptRoom(next) {
    if (!mounted.current || (roomRef.current?.code === next.code && roomRef.current.version > next.version)) return;
    const current = { ...next, receivedAt: Date.now() };
    roomRef.current = current;
    setRoom(current);
  }

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    let timer;
    async function poll() {
      try {
        const next = await pvpRequest(`/rooms/${session.code}`, { token: session.token, signal: controller.signal });
        if (controller.signal.aborted) return;
        acceptRoom(next);
        setConnection('live');
        setPollError('');
      } catch (failure) {
        if (controller.signal.aborted) return;
        setConnection([401, 404, 410].includes(failure.status) ? 'expired' : 'retrying');
        setPollError(failure.message);
        if ([401, 404, 410].includes(failure.status)) return;
      }
      timer = setTimeout(poll, 2000);
    }
    poll();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [session]);

  useEffect(() => {
    if (room?.status !== 'active') return;
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [room?.status]);

  async function connect(event) {
    event.preventDefault();
    if (action.current) return;
    const joining = event.nativeEvent.submitter?.value === 'join';
    const inviteCode = code.trim().toUpperCase();
    if (joining && !/^[A-F0-9]{10}$/.test(inviteCode)) { setError('Enter the 10-character invite code your friend shared.'); return; }
    const controller = new AbortController();
    action.current = controller;
    setBusy(true); setError(''); setPollError(''); setNotice('');
    try {
      const data = await pvpRequest(joining ? `/rooms/${inviteCode}/join` : '/rooms', { body: { trainerName: name, companionId: companion }, signal: controller.signal });
      if (controller.signal.aborted) return;
      const next = { code: data.room.code, token: data.token };
      if (!writePvpSession(tabStorage(), next)) setNotice('This browser cannot keep a room pass. Keep this page open; a reload will lose your seat.');
      window.history.replaceState(window.history.state, '', duelShareLink(window.location.href, next.code));
      acceptRoom(data.room);
      setSession(next); setConnection('live');
    } catch (failure) { if (!controller.signal.aborted) setError(failure.message); }
    finally { if (mounted.current) { setBusy(false); action.current = null; } }
  }

  function resetRoom() {
    writePvpSession(tabStorage(), null);
    setSession(null); setRoom(null); roomRef.current = null;
    setConnection('idle'); setError(''); setPollError(''); setNotice(''); setLeaving(false);
  }

  async function command(type, extra = {}) {
    if (action.current || !session || !roomRef.current) return;
    const controller = new AbortController();
    action.current = controller;
    setBusy(true); setError('');
    try {
      const next = await pvpRequest(`/rooms/${session.code}/command`, { token: session.token, body: { type, version: roomRef.current.version, ...extra }, signal: controller.signal });
      if (controller.signal.aborted) return;
      acceptRoom(next); setConnection('live');
      if (type === 'leave') { resetRoom(); onExit?.(); }
    } catch (failure) {
      if (controller.signal.aborted) return;
      setError(failure.message);
      if (failure.status === 409) {
        try {
          acceptRoom(await pvpRequest(`/rooms/${session.code}`, { token: session.token, signal: controller.signal }));
          setError('The room updated. Please try your action again.');
        }
        catch (refreshFailure) { if (!controller.signal.aborted) setError(refreshFailure.message); }
      }
      setLeaving(false);
    } finally { if (mounted.current) { setBusy(false); action.current = null; } }
  }

  async function copyInvite(link = false) {
    try {
      await navigator.clipboard.writeText(link ? duelShareLink(window.location.href, room.code) : room.code);
      if (mounted.current) setNotice(link ? 'Invite link copied. Send it to your friend.' : 'Invite code copied. Send it to your friend.');
    } catch { setNotice('Copy is unavailable here. Select the invite code below and copy it.'); }
  }

  function exit() {
    if (session && !room && connection !== 'expired') onExit?.();
    else if (session && connection !== 'expired' && !room?.players[room.seat]?.left) setLeaving(true);
    else { resetRoom(); onExit?.(); }
  }

  const me = room?.players[room.seat];
  const opponent = room?.players[1 - room.seat];
  const active = room?.status === 'active';
  const ready = active && me?.ready;
  const seconds = active ? duelSecondsLeft(room, clock) : 0;
  const canChoose = active && !ready && !busy && connection === 'live' && seconds > 0;
  const status = !room ? 'Reopening your room…' : room.status === 'waiting' ? 'Waiting for your friend to join.' : room.status === 'closed' ? 'This room is closed.'
    : room.status === 'finished' ? resultText(room) : ready ? `Your ${moveName(room.duel.myChoice)} is locked. Waiting for your friend.`
      : `Turn ${room.duel.turn}: choose a move. ${opponent?.ready ? 'Your friend has locked a choice.' : 'Both choices stay hidden until locked.'}`;

  return <main className="pvp-hall">
    <div className="pvp-frame">
      <header className="pvp-header"><div><h1 ref={heading} tabIndex="-1">Duel Hall</h1><p>Cogimon · Two trainers, one friendly duel</p></div><button type="button" disabled={busy} onClick={exit}>Leave Hall</button></header>
      {(error || pollError) && <div className="pvp-error" role="alert"><p>{error || pollError}</p>{session && connection === 'expired' && <button type="button" onClick={resetRoom}>Clear room pass</button>}</div>}
      {notice && <p className="pvp-notice" role="status">{notice}</p>}

      {!session ? <div className="pvp-entry">
        <section className="pvp-register" aria-labelledby="pvp-entry-title"><h2 id="pvp-entry-title">Bring a friend.</h2><p>Choose a companion, then open a room or enter your friend’s invite. You each control your own moves.</p>
          <form onSubmit={connect}>
            <label className="pvp-name">Trainer name<input value={name} onChange={event => setName(event.target.value)} required maxLength={24} autoComplete="nickname" disabled={busy} /></label>
            <fieldset disabled={busy}><legend>Your companion · equal duel stats</legend><div className="pvp-starter-picks">{PVP_COMPANIONS.map(entry => <button type="button" key={entry.id} aria-pressed={companion === entry.id} onClick={() => setCompanion(entry.id)}><CompanionArt id={entry.id} /><span>{entry.name}</span></button>)}</div></fieldset>
            <button className="pvp-primary" type="submit" name="action" value="create" disabled={busy}>{busy ? 'Opening the Hall…' : 'Open an invite room'}</button>
            <div className="pvp-join"><label>Friend’s invite code<input value={code} onChange={event => setCode(event.target.value.toUpperCase())} placeholder="10-character code" maxLength={10} autoCapitalize="characters" autoCorrect="off" spellCheck={false} disabled={busy} /></label><button type="submit" name="action" value="join" disabled={busy}>Join friend</button></div>
          </form>
        </section>
        <aside className="pvp-welcome"><CompanionArt id={companion} variant="front" /><h2>A fair start.</h2><p>40 HP. The same three moves. Your next choice makes the difference.</p><p>No keys, levels or purchases needed. Unranked · no Journey rewards.</p></aside>
      </div> : <>
        {room && <section className="pvp-room-strip" aria-label="Invite room"><label>Invite code<input aria-label="Invite code, select to copy" value={room.code} readOnly onFocus={event => event.target.select()} /></label><div className="pvp-actions"><button type="button" onClick={() => copyInvite()}>Copy code</button><button type="button" onClick={() => copyInvite(true)}>Copy invite link</button></div><p>{connection === 'live' ? 'Room connected' : connection === 'expired' ? 'Room unavailable' : 'Signal lost · reconnecting'}<br />Keep this tab to keep your seat.</p></section>}
        <section className="pvp-turn-status" aria-label="Duel status"><p role="status">{status}</p>{active && <span className="pvp-clock" aria-label={`${seconds} seconds remaining`}>{seconds > 0 ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : 'Resolving…'}</span>}</section>
        {room?.status === 'waiting' && <div className="pvp-waiting"><CompanionArt id={me.companionId} variant="back" /><div><h2>{me.trainerName}, your seat is ready.</h2><p>Send the code to one friend. They join the same game server from their own browser or device and choose their companion.</p><p>You can refresh this tab to return. The invite code admits one guest; share it only with the trainer you want to duel.</p></div></div>}
        {room?.duel && <>
          <div className="pvp-battlefield"><Fighter player={me} self active={active} /><span className="pvp-versus" aria-hidden="true">VS</span><Fighter player={opponent} active={active} /></div>
          {active ? <section className="pvp-command-panel" aria-labelledby="pvp-moves-heading"><h2 id="pvp-moves-heading" ref={turnHeading} tabIndex={-1}>{ready ? 'Choice locked. Hold your signal.' : 'Choose your signal.'}</h2><div className="pvp-moves">{PVP_MOVES.map(move => <button key={move.id} type="button" className={room.duel.myChoice === move.id ? 'is-chosen' : ''} disabled={!canChoose || me.energy < move.cost} onClick={() => command('choice', { moveId: move.id })}><strong>{move.name}</strong><span>{move.cost ? `${move.cost} energy` : 'Free'} · {move.damage} damage{move.guard ? ` · ${move.guard} block` : ''}</span><small>{move.restore ? `Recover ${move.restore} energy` : me.energy < move.cost ? 'Not enough energy' : 'Spend energy for a heavy hit'}</small></button>)}</div><p>{ready ? 'You can’t change a locked move. Both moves resolve together.' : 'Strike and Ward recover energy. Overcharge spends it. Read the Duel Guide for timing.'}</p></section>
            : <section className="pvp-result" aria-labelledby="pvp-result-heading"><h2 id="pvp-result-heading" ref={resultHeading} tabIndex={-1}>{room.duel.result.winner === null ? 'Even signals.' : room.duel.result.winner === room.seat ? 'Well played, trainer.' : 'Another lesson learned.'}</h2><p>{opponent.left ? 'Your friend has left. Open a fresh room for another duel.' : me.rematch ? 'Rematch requested. Waiting for your friend to agree.' : opponent.rematch ? 'Your friend wants a rematch. Ready for another duel?' : 'Both trainers must agree to a rematch. Your companion will return at full HP and 3 energy.'}</p><div className="pvp-actions"><button type="button" className="pvp-primary" disabled={busy || connection !== 'live' || me.rematch || me.left || opponent.left} onClick={() => command('rematch')}>{me.rematch ? 'Waiting for rematch' : 'Request rematch'}</button><button type="button" disabled={busy} onClick={exit}>Leave Hall</button></div></section>}
          {room.duel.history.length > 0 && <details className="pvp-history"><summary>Turn record · {room.duel.history.length} resolved</summary><ol>{room.duel.history.map(turn => <li key={`${room.match}-${turn.turn}`}><strong>Turn {turn.turn}</strong><span>You: {moveName(turn.choices[room.seat])} · took {turn.damage[room.seat]} damage</span><span>{opponent.trainerName}: {moveName(turn.choices[1 - room.seat])} · took {turn.damage[1 - room.seat]} damage</span></li>)}</ol></details>}
        </>}
      </>}
      <DuelGuide />
      <footer className="pvp-footer">Friend duels run on this game server. Your Journey save stays on your device.</footer>
    </div>
    {leaving && <LeaveDialog active={active} busy={busy} offline={connection !== 'live'} onClose={() => setLeaving(false)} onLeave={() => command('leave')} onReturn={onExit} />}
  </main>;
}
