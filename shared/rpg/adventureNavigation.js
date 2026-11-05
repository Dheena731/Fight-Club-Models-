import { ADVENTURE_REGIONS } from './adventureContent.js';
import { exitLocked, regionObjects, worldProjectProgress } from './adventure.js';

export function mapLandmarks(state, regionId) {
  const publicLeads = worldProjectProgress(state).filter(project => !project.complete && project.regionId === regionId).map(project => project.objectId);
  return regionObjects({ ...state, locationId: regionId }).filter(object =>
    (state.discoveries.includes(regionId) || publicLeads.includes(object.id)) &&
    object.type !== 'enemy' && (object.type !== 'pickup' || publicLeads.includes(object.id)) &&
    (object.id !== 'sunward-overlook' || state.flags.overlookFound) &&
    (!object.secret || state.flags[object.discoveryFlag]));
}

export function adventureRoute(state, target) {
  const region = target && Object.hasOwn(ADVENTURE_REGIONS, target.regionId) && ADVENTURE_REGIONS[target.regionId];
  if (!region || !Object.hasOwn(ADVENTURE_REGIONS, state.locationId)) return null;
  const landmark = target.objectId ? mapLandmarks(state, region.id).find(object => object.id === target.objectId) : null;
  if (target.objectId && !landmark) return null;
  const queue = [{ regionId: state.locationId, path: [state.locationId], next: null }];
  const seen = new Set([state.locationId]);
  for (const step of queue) {
    if (step.regionId === region.id) {
      const next = step.next || landmark;
      const dx = next ? next.x - state.x : 0; const dy = next ? next.y - state.y : 0;
      const arrived = !step.next && (!landmark || Math.abs(dx) + Math.abs(dy) <= 1);
      return { name: landmark?.name || region.name, regionId: region.id, path: step.path, next, arrived, blocked: false,
        direction: [dy < 0 ? 'north' : dy > 0 ? 'south' : '', dx < 0 ? 'west' : dx > 0 ? 'east' : ''].filter(Boolean).join('-') || 'here' };
    }
    const exits = regionObjects({ ...state, locationId: step.regionId }).filter(object => object.type === 'exit' && ADVENTURE_REGIONS[object.to] && !exitLocked(state, object));
    // Prefer a nearby gateway when two exits reach the same region.
    if (step.regionId === state.locationId) exits.sort((a, b) => Math.abs(a.x - state.x) + Math.abs(a.y - state.y) - Math.abs(b.x - state.x) - Math.abs(b.y - state.y));
    for (const exit of exits) {
      if (seen.has(exit.to)) continue;
      seen.add(exit.to);
      queue.push({ regionId: exit.to, path: [...step.path, exit.to], next: step.next || exit });
    }
  }
  return { name: landmark?.name || region.name, regionId: region.id, path: [], next: null, arrived: false, blocked: true, direction: null };
}
