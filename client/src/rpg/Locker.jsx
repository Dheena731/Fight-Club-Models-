import { useEffect, useId, useRef, useState } from 'react';
import { COSMETICS, PROFILE_COMPANIONS, createProfile, equipCosmetic, getCosmetic } from '../../../shared/rpg/profile.js';
import { CREATURES } from '../components/creatures/pixelData';
import PixelCreature from '../components/creatures/PixelCreature';
import './locker.css';

export function CompanionPortrait({ companionId, skinId = null }) {
  const companion = PROFILE_COMPANIONS.find((entry) => entry.id === companionId) ?? PROFILE_COMPANIONS[0];
  const src = `/assets/frontier/portraits/${companion.id}.png`;
  const [failedSrc, setFailedSrc] = useState(null);
  const lantern = skinId === 'skin-lantern' && getCosmetic(skinId).companionIds.includes(companion.id);
  return (
    <div className={`frontier-portrait${lantern ? ' frontier-portrait--lantern' : ''}`}>
      {failedSrc === src ? (
        <div role="img" aria-label={`${companion.name}. ${companion.description} Pixel portrait fallback.`}>
          <div aria-hidden="true"><PixelCreature creature={CREATURES[companion.id]} scale={1.6} /></div>
        </div>
      ) : <img src={src} alt={`${companion.name}. ${companion.description}`} onError={() => setFailedSrc(src)} />}
    </div>
  );
}

function TrainerPortrait() {
  const [failed, setFailed] = useState(false);
  return failed ? <span className="frontier-trainer-fallback">Trainer</span> : (
    <img className="frontier-trainer-portrait" src="/assets/frontier/portraits/trainer.png"
      alt="Human field trainer in a travel outfit with a backpack." onError={() => setFailed(true)} />
  );
}

/** Reusable offline preview; never starts a match. */
export function IdentityPreview({ profile, heading = 'Your identity' }) {
  const current = createProfile(profile);
  const companion = PROFILE_COMPANIONS.find((entry) => entry.id === current.companionId);
  const title = getCosmetic(current.loadout.titleId);
  return (
    <section className="frontier-identity">
      <h2>{heading}</h2>
      <div className="frontier-identity-trainer">
        <TrainerPortrait />
        <div><h3>{current.trainerName}</h3><p>{title?.name ?? 'No title equipped'}</p></div>
      </div>
      <figure>
        <CompanionPortrait companionId={current.companionId} skinId={current.loadout.skinId} />
        <figcaption><strong>Companion · {companion.name}</strong>
          <span>{current.loadout.skinId ? 'Lantern glow · cosmetic frame' : 'Standard appearance'}</span>
        </figcaption>
      </figure>
      <p>Adventure level {current.level} · prestige only</p>
      <p>{current.worldsCleared} {current.worldsCleared === 1 ? 'world' : 'worlds'} cleared</p>
      <div className="frontier-identity-badges">
        <p>{current.loadout.badgeIds.length} of 3 badges pinned</p>
        {current.loadout.badgeIds.length ? (
          <ul aria-label="Pinned badges">{current.loadout.badgeIds.map((id) => <li key={id}>{getCosmetic(id).name}</li>)}</ul>
        ) : <p className="frontier-profile-muted">No badges pinned yet.</p>}
      </div>
      <p className="frontier-local-label">Local / unverified</p>
      <p className="frontier-profile-muted">Adventure prestige and cosmetics never change live-model combat power.</p>
    </section>
  );
}

export default function Locker({ profile, onChange, onClose }) {
  const current = createProfile(profile);
  const headingRef = useRef(null);
  const id = useId();
  const [message, setMessage] = useState('');
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, []);

  function change(item, unequip = false) {
    const next = equipCosmetic(current, item.id, { unequip });
    onChange?.(next);
    setMessage(unequip ? `${item.name} removed. You still own it.` : `${item.name} ${item.type === 'badge' ? 'pinned' : 'equipped'}.`);
  }

  function itemRow(item) {
    const owned = current.ownedIds.includes(item.id);
    const equipped = item.type === 'badge' ? current.loadout.badgeIds.includes(item.id)
      : current.loadout[item.type === 'skin' ? 'skinId' : 'titleId'] === item.id;
    const fits = !item.companionIds || item.companionIds.includes(current.companionId);
    const full = item.type === 'badge' && current.loadout.badgeIds.length >= 3 && !equipped;
    const hintId = `${id}-${item.id}`;
    const state = equipped ? 'Equipped' : owned ? 'Owned' : 'Locked';
    const action = !owned ? 'Locked' : !fits ? 'Does not fit' : equipped
      ? (item.type === 'badge' ? 'Unpin' : 'Remove') : full ? 'Badge pins full' : item.type === 'badge' ? 'Pin badge' : 'Equip';
    return (
      <li key={item.id} className={`frontier-locker-item${equipped ? ' is-equipped' : ''}`}>
        <div className="frontier-locker-item-copy">
          <div className="frontier-locker-item-heading"><h3>{item.name}</h3><span className="frontier-locker-state">{state}</span></div>
          <p>{item.description}</p>
          <p id={hintId} className="frontier-profile-muted">
            {!owned ? `Unlock: ${item.unlockHint}` : !fits
              ? 'Fits Emberquill, Kitewhisk and Duplet. Switch your lead companion in the Journey to wear it.'
              : full ? 'Unpin a badge to make room. You can pin up to three distinct badges.'
              : equipped ? 'You can remove this without losing the unlock.' : 'Ready to equip. This reward stays in your collection.'}
          </p>
        </div>
        <button type="button" className="frontier-profile-button" disabled={!owned || !fits || full || !onChange}
          aria-describedby={hintId} aria-label={`${action}: ${item.name}`} onClick={() => change(item, equipped)}>{action}</button>
      </li>
    );
  }

  return (
    <main className="frontier-profile-ui frontier-locker" aria-labelledby={`${id}-heading`}>
      <div className="frontier-locker-shell">
        <header className="frontier-locker-header">
          <div><h1 id={`${id}-heading`} tabIndex={-1} ref={headingRef}>Locker</h1><p>Keep the discoveries. Choose what you carry.</p></div>
          <button type="button" className="frontier-profile-button" onClick={onClose} disabled={!onClose}>Back to adventure</button>
        </header>
        <div className="frontier-locker-layout">
          <IdentityPreview profile={current} />
          <div className="frontier-locker-collection">
            <p className="frontier-locker-note">Rewards are earned in the Journey, not Practice or replay. All unlocks on this device are local / unverified.</p>
            <section aria-labelledby={`${id}-appearance`}>
              <h2 id={`${id}-appearance`}>Appearance</h2>
              <div className="frontier-locker-base">
                <div><h3>Standard appearance</h3><p>Always available · {current.loadout.skinId ? 'Owned' : 'Equipped'}</p></div>
                <button type="button" className="frontier-profile-button" disabled={!current.loadout.skinId || !onChange}
                  onClick={() => change(getCosmetic(current.loadout.skinId), true)}>{current.loadout.skinId ? 'Use standard' : 'Equipped'}</button>
              </div>
              <ul className="frontier-locker-items">{COSMETICS.filter((item) => item.type === 'skin').map(itemRow)}</ul>
            </section>
            <section aria-labelledby={`${id}-titles`}>
              <h2 id={`${id}-titles`}>Title</h2><p>A title is optional. Remove it any time to show just your trainer name.</p>
              <ul className="frontier-locker-items">{COSMETICS.filter((item) => item.type === 'title').map(itemRow)}</ul>
            </section>
            <section aria-labelledby={`${id}-badges`}>
              <h2 id={`${id}-badges`}>Pinned badges · {current.loadout.badgeIds.length}/3</h2>
              <p>Pin up to three distinct discoveries, in the order you want them shown.</p>
              <ul className="frontier-locker-items">{COSMETICS.filter((item) => item.type === 'badge').map(itemRow)}</ul>
            </section>
            <p role="status" aria-live="polite" aria-atomic="true" className="frontier-locker-feedback">{message}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
