export function readDuelInvite(hash) {
  return typeof hash === 'string' ? /^#duel=([A-F0-9]{10})$/i.exec(hash)?.[1].toUpperCase() || null : null;
}
