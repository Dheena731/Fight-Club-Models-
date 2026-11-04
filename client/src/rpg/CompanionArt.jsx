import { useState } from 'react';

const STARTERS = ['emberquill', 'kitewhisk', 'duplet'];
const NAMES = { emberquill: 'Emberquill', kitewhisk: 'Kitewhisk', duplet: 'Duplet', crosswake: 'Crosswake', zipcat: 'Zipcat', rampart: 'Rampart', latticewing: 'Latticewing', mossback: 'Mossback', patchbyte: 'Patchbyte', trainer: 'Trainer' };
const ENEMIES = { 'static-wisp': 0, 'practice-wisp': 0, 'archive-warden': 1 };

export default function CompanionArt({ id = 'emberquill', variant = 'portrait', skinId, className = '', style, alt }) {
  const [failed, setFailed] = useState(false);
  const column = STARTERS.indexOf(id);
  const battle = variant === 'front' || variant === 'back';
  return <span className={`journey-art ${battle ? 'is-battle' : ''} ${skinId === 'skin-lantern' ? 'has-lantern-skin' : ''} ${className}`} style={style}>
    {Object.hasOwn(ENEMIES, id) ? <span className="journey-battle-sprite" role="img" aria-label={alt || (ENEMIES[id] === 0 ? 'Static Wisp' : 'Archive Warden')}
      style={{ backgroundImage: 'url(/assets/frontier/enemy-atlas.png)', backgroundSize: '200% 100%', backgroundPosition: `${ENEMIES[id] * 100}% 0%` }} />
      : battle && column >= 0 && !failed ? <span className="journey-battle-sprite" role="img" aria-label={alt || `${NAMES[id]} ${variant === 'back' ? 'facing the opponent' : 'battle pose'}`}
      style={{ backgroundImage: 'url(/assets/frontier/starter-battle-atlas.png)', backgroundSize: '300% 200%', backgroundPosition: `${column * 50}% ${variant === 'back' ? 100 : 0}%` }} />
      : failed ? <span className="journey-art-fallback" role="img" aria-label={alt || NAMES[id] || 'Companion'}>{(NAMES[id] || 'Companion').slice(0, 1)}</span>
        : <img src={`/assets/frontier/portraits/${NAMES[id] ? id : 'patchbyte'}.png`} alt={alt || NAMES[id] || 'Companion'} loading="lazy" decoding="async" onError={() => setFailed(true)} />}
    {skinId === 'skin-lantern' && <span className="journey-lantern-seal" aria-label="Lantern aura equipped">✦</span>}
  </span>;
}
