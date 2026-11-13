import { useEffect, useRef, useState } from 'react';
import { PVP_COMPANIONS, PVP_MOVES, PVP_HP, PVP_ENERGY, PVP_MAX_TURNS } from '../../../../shared/rpg/pvp.js';
import { readDuelInvite } from '../../lib/duelInvite.js';
import CompanionArt from '../CompanionArt.jsx';
import { duelSecondsLeft, duelShareLink, pvpRequest, readPvpSession, writePvpSession } from './session.js';
import { newPlaybackTurns } from './playback.js';
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

function DuelGuide({ open = false }) {
  return <details className="pvp-guide" open={open || undefined}>
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

function BattleInfo({ title, onClose, children }) {
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const element = dialog.current;
    element.showModal();
    return () => { element.close(); if (previous?.isConnected) previous.focus(); };
  }, []);
  return <dialog ref={dialog} className="pvp-hall pvp-info-dialog" aria-label={title} onCancel={onClose}>
    <button type="button" onClick={onClose} autoFocus>Close {title}</button>{children}
  </dialog>;
}

function Fighter({ player, self, active, turn, phase, seat }) {
  const move = turn?.choices[seat];
  const impact = phase === 'impact' || phase === 'settle';
  const hp = turn ? (impact ? turn.hp[seat] : turn.before[seat]) : player.hp;
  const energy = turn ? (impact ? turn.afterEnergy[seat] : turn.beforeEnergy[seat]) : player.energy;
  const damage = turn?.damage[seat];
  return <section className={`pvp-fighter ${self ? 'is-self' : 'is-rival'} ${turn ? `move-${move} phase-${phase}` : ''} ${hp === 0 ? 'is-knocked-out' : ''} ${turn ? (damage ? 'is-damaged' : 'is-blocked') : ''}`} aria-label={`${self ? 'Your' : 'Opponent'} companion`}>
    <div className="pvp-fighter-hud">
      <div className="pvp-fighter-name"><strong>{companionName(player.companionId)}</strong><span title={player.trainerName}>{player.trainerName}{self ? ' · You' : ''}</span></div>
      <label className={`pvp-hp ${hp <= 10 ? 'is-critical' : hp <= 20 ? 'is-low' : ''}`}><span>HP <b>{hp} / {PVP_HP}</b></span><meter value={hp} min="0" max={PVP_HP} aria-label={`${companionName(player.companionId)} HP`} /></label>
      <div className="pvp-energy"><span>Energy {energy} / {PVP_ENERGY}</span><div aria-hidden="true">{Array.from({ length: PVP_ENERGY }, (_, index) => <i key={index} className={index < energy ? 'is-filled' : ''} />)}</div></div>
      <p className="pvp-ready">{turn ? 'Resolving' : player.left ? 'Left' : !active ? 'Finished' : player.ready ? 'Locked' : 'Choosing'}</p>
    </div>
    <div className="pvp-stage"><div className="pvp-sprite"><CompanionArt id={player.companionId} variant={self ? 'back' : 'front'} /></div><span className="pvp-effect" aria-hidden="true" />{impact && <span className="pvp-damage" aria-hidden="true">{damage ? `−${damage}` : 'Blocked'}</span>}</div><span className="pvp-projectile" aria-hidden="true" />
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
  const [playback, setPlayback] = useState(null);
  const [menu, setMenu] = useState('root');
  const [info, setInfo] = useState(null);
  const [selectedMove, setSelectedMove] = useState(PVP_MOVES[0].id);
  const isPlaying = Boolean(playback);
  const phase = playback?.phase;
  const playingTurn = playback?.queue[0];
  const action = useRef(null);
  const mounted = useRef(true);
  const heading = useRef(null);
  const roomRef = useRef(null);
  const turnHeading = useRef(null);
  const resultHeading = useRef(null);
  const fightButton = useRef(null);
  const moveGrid = useRef(null);

  useEffect(() => {
    if (isPlaying) return;
    if (room?.status === 'active') (fightButton.current && !fightButton.current.disabled ? fightButton.current : turnHeading.current)?.focus({ preventScroll: true });
    else if (room?.status === 'finished') resultHeading.current?.focus();
  }, [room?.status, isPlaying]);

  useEffect(() => { if (isPlaying) setMenu('root'); }, [isPlaying]);
  useEffect(() => { if (menu === 'moves') moveGrid.current?.querySelector('button:not(:disabled)')?.focus(); }, [menu]);

  function navigateCommands(event) {
    if (event.key === 'Escape' && menu === 'moves') {
      setMenu('root');
      requestAnimationFrame(() => fightButton.current?.focus());
      return;
    }
    const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -2, ArrowDown: 2 };
    if (!(event.key in offsets)) return;
    const buttons = [...event.currentTarget.querySelectorAll('button')];
    const index = buttons.indexOf(document.activeElement);
    if (index < 0 || !buttons.length) return;
    event.preventDefault();
    let next = index;
    for (let attempt = 0; attempt < buttons.length; attempt++) {
      next = (next + offsets[event.key] + buttons.length) % buttons.length;
      if (!buttons[next].disabled) { buttons[next].focus(); break; }
    }
  }

  useEffect(() => {
    mounted.current = true;
    heading.current?.focus({ preventScroll: true });
    return () => { mounted.current = false; action.current?.abort(); };
  }, []);

  function acceptRoom(next) {
    if (!mounted.current || (roomRef.current?.code === next.code && roomRef.current.version > next.version)) return;
    const previous = roomRef.current;
    const turns = newPlaybackTurns(previous, next);
    if (!previous || previous.code !== next.code || previous.match !== next.match) setPlayback(null);
    else if (turns.length) setPlayback(current => current ? { ...current, queue: [...current.queue, ...turns] } : { queue: turns, phase: 'reveal' });
    const current = { ...next, receivedAt: Date.now() };
    roomRef.current = current;
    setRoom(current);
  }

  useEffect(() => {
    if (!phase) return;
    const delay = { reveal: 550, action: 550, impact: 650, settle: 300 }[phase];
    const timer = setTimeout(() => setPlayback(current => {
      if (!current) return null;
      if (current.phase === 'reveal') return { ...current, phase: 'action' };
      if (current.phase === 'action') return { ...current, phase: 'impact' };
      if (current.phase === 'impact') return { ...current, phase: 'settle' };
      return current.queue.length > 1 ? { queue: current.queue.slice(1), phase: 'reveal' } : null;
    }), delay);
    return () => clearTimeout(timer);
  }, [phase, playingTurn]);

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
    setSession(null); setRoom(null); roomRef.current = null; setPlayback(null);
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
  const turn = playback?.queue[0];
  const canChoose = active && !playback && !ready && !busy && connection === 'live' && seconds > 0;
  const selected = PVP_MOVES.find(move => move.id === selectedMove);
  const status = turn ? `Turn ${turn.turn}: ${me.trainerName} used ${moveName(turn.choices[room.seat])}; ${opponent.trainerName} used ${moveName(turn.choices[1 - room.seat])}.${playback.phase === 'impact' || playback.phase === 'settle' ? ` ${me.trainerName} ${turn.damage[room.seat] ? `took ${turn.damage[room.seat]} damage` : 'blocked the attack'}; ${opponent.trainerName} ${turn.damage[1 - room.seat] ? `took ${turn.damage[1 - room.seat]} damage` : 'blocked the attack'}.` : ''}` : !room ? 'Reopening your room…' : room.status === 'waiting' ? 'Waiting for your friend to join.' : room.status === 'closed' ? 'This room is closed.'
    : room.status === 'finished' ? resultText(room) : ready ? `Your ${moveName(room.duel.myChoice)} is locked. Waiting for your friend.`
      : `Turn ${room.duel.turn}: choose a move. ${opponent?.ready ? 'Your friend has locked a choice.' : 'Both choices stay hidden until locked.'}`;

  const narration = turn ? (phase === 'impact' || phase === 'settle' ? `${companionName(me.companionId)} ${turn.damage[room.seat] ? `took ${turn.damage[room.seat]} damage` : 'blocked the attack'}! ${companionName(opponent.companionId)} ${turn.damage[1 - room.seat] ? `took ${turn.damage[1 - room.seat]} damage` : 'blocked the attack'}!` : `${companionName(me.companionId)} used ${moveName(turn.choices[room.seat])}! ${companionName(opponent.companionId)} used ${moveName(turn.choices[1 - room.seat])}!`) : ready ? `Waiting for ${opponent.trainerName}…` : `What will ${companionName(me?.companionId)} do?`;

  return <main className={`pvp-hall ${room?.duel ? 'has-battle' : ''}`}>
    <div className="pvp-frame">
      <header className="pvp-header"><div><h1 ref={heading} tabIndex="-1">Duel Hall</h1>{room?.duel ? <p title={opponent?.trainerName}>vs {opponent?.trainerName} · {connection === 'live' ? 'Connected' : 'Reconnecting'}{playback ? ` · Turn ${playingTurn.turn} · Resolving` : active && ` · Turn ${room.duel.turn} · ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`}</p> : <p>Cogimon · Two trainers, one friendly duel</p>}</div>{!room?.duel && <button type="button" disabled={busy} onClick={exit}>Leave Hall</button>}</header>
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
        {room && !room.duel && <details className="pvp-room-details" open><summary>Room invite</summary><section className="pvp-room-strip" aria-label="Invite room"><label>Invite code<input aria-label="Invite code, select to copy" value={room.code} readOnly onFocus={event => event.target.select()} /></label><div className="pvp-actions"><button type="button" onClick={() => copyInvite()}>Copy code</button><button type="button" onClick={() => copyInvite(true)}>Copy invite link</button></div><p>{connection === 'live' ? 'Room connected' : connection === 'expired' ? 'Room unavailable' : 'Signal lost · reconnecting'}<br />Keep this tab to keep your seat.</p></section></details>}
        {!room?.duel && <section className="pvp-turn-status" aria-label="Duel status"><p role="status">{status}</p></section>}
        {room?.status === 'waiting' && <div className="pvp-waiting"><CompanionArt id={me.companionId} variant="back" /><div><h2>{me.trainerName}, your seat is ready.</h2><p>Send the code to one friend. They join the same game server from their own browser or device and choose their companion.</p><p>You can refresh this tab to return. The invite code admits one guest; share it only with the trainer you want to duel.</p></div></div>}
        {room?.duel && <div className="pvp-battle-screen">
          <div className="pvp-battlefield" data-phase={playback?.phase || "idle"}><Fighter player={opponent} active={active} turn={turn} phase={playback?.phase} seat={1 - room.seat} /><Fighter player={me} self active={active} turn={turn} phase={playback?.phase} seat={room.seat} /></div>
          <section className="pvp-console">
            {(active || playback) ? <><div className="pvp-dialogue"><p ref={turnHeading} tabIndex={-1} aria-live="polite">{narration}</p>{menu === 'moves' && !playback && <small>Energy {me.energy}/{PVP_ENERGY} · {selected.name}: {selected.damage} power · {selected.guard || 0} block · {selected.cost} cost{selected.restore ? ` · +${selected.restore} energy` : ''}</small>}</div>
              {menu === 'moves' && !playback ? <div ref={moveGrid} className="pvp-moves" aria-label="Choose a move" onKeyDown={navigateCommands}>{PVP_MOVES.map(move => <button key={move.id} data-move-id={move.id} type="button" title={move.description} disabled={!canChoose || me.energy < move.cost} onFocus={() => setSelectedMove(move.id)} onMouseEnter={() => setSelectedMove(move.id)} onClick={() => { setMenu('root'); command('choice', { moveId: move.id }); }}>{move.name}</button>)}<button type="button" onClick={() => { setMenu('root'); requestAnimationFrame(() => fightButton.current?.focus()); }}>Back</button></div> : <div className="pvp-main-commands" aria-label="Battle commands" onKeyDown={navigateCommands}><button ref={fightButton} type="button" disabled={!canChoose} onClick={() => setMenu('moves')}>Fight</button><button type="button" disabled={isPlaying || !room.duel.history.length} title={!room.duel.history.length ? 'No turns recorded yet' : undefined} onClick={() => setInfo('Record')}>Record</button><button type="button" disabled={isPlaying} onClick={() => setInfo('Guide')}>Guide</button><button type="button" disabled={busy || isPlaying} onClick={exit}>Leave</button></div>}
            </> : <section className="pvp-result"><div className="pvp-dialogue"><p ref={resultHeading} tabIndex={-1} role="status">{resultText(room)} {opponent.left ? 'Your friend has left.' : me.rematch ? 'Waiting for your friend to agree.' : opponent.rematch ? 'Your friend wants a rematch.' : 'Both trainers must agree to a rematch.'}</p></div><div className="pvp-main-commands"><button type="button" disabled={busy || connection !== 'live' || me.rematch || me.left || opponent.left} onClick={() => command('rematch')}>{me.rematch ? 'Waiting…' : 'Rematch'}</button><button type="button" disabled={busy} onClick={exit}>Leave</button><button type="button" disabled={!room.duel.history.length} onClick={() => setInfo('Record')}>Record</button><button type="button" onClick={() => setInfo('Guide')}>Guide</button></div></section>}
          </section>
        </div>}
      </>}
      {!room?.duel && <><DuelGuide /><footer className="pvp-footer">Friend duels run on this game server. Your Journey save stays on your device.</footer></>}
    </div>
    {leaving && <LeaveDialog active={active} busy={busy} offline={connection !== 'live'} onClose={() => setLeaving(false)} onLeave={() => command('leave')} onReturn={onExit} />}
    {info && <BattleInfo title={info} onClose={() => setInfo(null)}>{info === 'Guide' ? <DuelGuide open /> : <div className="pvp-history"><h2>Turn record</h2><ol>{room.duel.history.map(item => <li key={`${room.match}-${item.turn}`}><strong>Turn {item.turn}</strong><span>You: {moveName(item.choices[room.seat])} · took {item.damage[room.seat]} damage</span><span>{opponent.trainerName}: {moveName(item.choices[1 - room.seat])} · took {item.damage[1 - room.seat]} damage</span></li>)}</ol></div>}</BattleInfo>}
  </main>;
}
