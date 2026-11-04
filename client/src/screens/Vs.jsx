import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameState, useGameDispatch } from '../game/GameContext';
import { FIGHTERS } from '../../../shared/fighters.js';
import { PROFILE_VERSION, PROFILE_COMPANIONS, createProfile, loadProfile, profileSnapshot } from '../../../shared/rpg/profile.js';
import { FIGHTER_CREATURE, PROVIDER_CREATURE } from '../components/creatures/pixelData';
import { CompanionPortrait, IdentityPreview } from '../rpg/Locker';

const VS_MIN_MS = 2400;

function ModelIdentity({ label, fighter, spec }) {
  const builtin = Object.values(FIGHTERS).find((entry) => entry.id === fighter?.id);
  return (
    <div className="frontier-vs-model">
      <h2>{label}</h2>
      <p><strong>{fighter?.name ?? 'Selected model'}</strong></p>
      <dl>
        <dt>Actual model ID</dt><dd>{spec?.model ?? fighter?.modelId ?? builtin?.modelId ?? 'Not supplied'}</dd>
        <dt>Provider route</dt><dd>{spec?.provider ?? fighter?.provider ?? builtin?.provider ?? 'Custom route'}</dd>
      </dl>
    </div>
  );
}

/** Existing live-match handoff only. Identity display performs no model/provider calls. */
export default function Vs() {
  const { loadout } = useGameState();
  const dispatch = useGameDispatch();
  const [identity] = useState(() => profileSnapshot(
    loadout?.identity?.version === PROFILE_VERSION ? loadout.identity : loadProfile() ?? createProfile(),
  ));
  const [paused, setPaused] = useState(() => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false);
  const doneRef = useRef(false);
  const headingRef = useRef(null);
  const hasLoadout = Boolean(loadout);
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    dispatch({ type: 'VS_DONE' });
  }, [dispatch]);

  useEffect(() => {
    if (!hasLoadout) {
      dispatch({ type: 'EXIT_TO_SELECT' });
      return undefined;
    }
    if (paused) return undefined;
    const timer = setTimeout(finish, VS_MIN_MS);
    return () => clearTimeout(timer);
  }, [hasLoadout, paused, finish, dispatch]);

  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, []);

  if (!loadout) return null;
  const a = loadout.fighters?.a;
  const b = loadout.fighters?.b;
  const mascotId = FIGHTER_CREATURE[b?.id] ?? PROVIDER_CREATURE[loadout.fighterBId?.provider] ?? 'patchbyte';
  const mascot = PROFILE_COMPANIONS.find((entry) => entry.id === mascotId) ?? PROFILE_COMPANIONS[8];

  return (
    <main className="frontier-profile-ui frontier-vs" aria-labelledby="frontier-vs-heading"
      onKeyDownCapture={(event) => { if (event.key === 'Tab') setPaused(true); }}>
      <div className="frontier-vs-shell">
        <header className="frontier-vs-header">
          <h1 id="frontier-vs-heading" ref={headingRef} tabIndex={-1}>Fighters ready</h1>
          <p>Live Arena · both models are configured in this browser. This is not human PvP or ranked matchmaking.</p>
          <p role="status">{paused ? 'Automatic advance paused. Continue when you are ready.' : 'Continuing shortly. Skip or pause to inspect your identity.'}</p>
          <div className="frontier-vs-actions">
            <button type="button" className="frontier-profile-button frontier-profile-button--primary" onClick={finish}>Continue to corner</button>
            <button type="button" className="frontier-profile-button" aria-pressed={paused} onClick={() => setPaused((value) => !value)}>
              {paused ? 'Resume introduction' : 'Pause introduction'}
            </button>
          </div>
        </header>
        <div className="frontier-vs-sides">
          <section aria-label="Your identity and model A">
            <IdentityPreview profile={identity} heading="Your companion identity" />
            <ModelIdentity label="Model A" fighter={a} spec={loadout.fighterAId} />
          </section>
          <div className="frontier-vs-separator" aria-hidden="true">VS</div>
          <section aria-label="Model B, configured in this browser">
            <figure className="frontier-vs-mascot">
              <CompanionPortrait companionId={mascot.id} />
              <figcaption>Arena mascot · {mascot.name}. Not another player’s companion.</figcaption>
            </figure>
            <ModelIdentity label="Model B" fighter={b} spec={loadout.fighterBId} />
            <p className="frontier-profile-muted">Companion art is a cosmetic identity, not a model capability or ranking.</p>
          </section>
        </div>
        <footer className="frontier-vs-footer">
          <p>No model calls during this introduction. Next: prepare your corner.</p>
        </footer>
      </div>
    </main>
  );
}
