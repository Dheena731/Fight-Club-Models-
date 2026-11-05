import { useState } from 'react';
import { ADVENTURE_REGIONS, terrainAt } from '../../../shared/rpg/adventureContent.js';
import { exitLocked, regionObjects, sideObjective, townObjective, worldProjectProgress } from '../../../shared/rpg/adventure.js';

import { adventureRoute, mapLandmarks } from '../../../shared/rpg/adventureNavigation.js';

const REGION_POINTS = { frontier: [18, 18], grove: [50, 18], sunward: [82, 18], riverlands: [18, 50], orchard: [50, 50], highlands: [82, 50], archive: [18, 82] };

export default function FieldMap({ state, target, onTrack, onClear }) {
  const [selectedId, setSelectedId] = useState(state.locationId);
  const region = ADVENTURE_REGIONS[selectedId];
  const route = adventureRoute(state, target);
  const landmarks = mapLandmarks(state, selectedId);
  const connections = Object.values(ADVENTURE_REGIONS).filter(entry => entry.outdoor !== false).flatMap(entry => entry.objects
    .filter(object => object.type === 'exit' && ADVENTURE_REGIONS[object.to]?.outdoor !== false && entry.id < object.to)
    .map(object => ({ from: entry.id, to: object.to, object, locked: Boolean(exitLocked(state, object) || ADVENTURE_REGIONS[object.to].objects.some(other => other.to === entry.id && other.requiresFlag === object.requiresFlag && exitLocked(state, other))) })))
    .filter((connection, index, all) => all.findIndex(other => other.from === connection.from && other.to === connection.to && other.object.requiresFlag === connection.object.requiresFlag) === index);
  const projects = worldProjectProgress(state);
  const routeEdges = new Set(route?.path.slice(1).map((id, index) => [route.path[index], id].sort().join(':')));
  const outdoorRegions = Object.values(ADVENTURE_REGIONS).filter(entry => entry.outdoor !== false);
  const parentId = region.parentRegion || selectedId;
  const rooms = Object.values(ADVENTURE_REGIONS).filter(entry => entry.parentRegion === parentId);
  const visited = state.discoveries.includes(selectedId);
  const objects = regionObjects({ ...state, locationId: selectedId }).filter(object => (object.id !== 'sunward-overlook' || state.flags.overlookFound) && (!object.secret || state.flags[object.discoveryFlag]));
  const exits = region.objects.filter(object => object.type === 'exit' && ADVENTURE_REGIONS[object.to].outdoor !== false);
  const discoveries = region.objects.filter(object => object.discoveryFlag && state.flags[object.discoveryFlag]);
  const optional = townObjective(state) || sideObjective(state);
  return <div className="journey-field-map">
    <p className="journey-muted">Choose a region or known landmark to track. Routes follow open gateways; walk there and Interact to travel.</p>
    <nav className="journey-world-map" aria-label="Valley routes">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{connections.map(({ from, to, object, locked }) => <path key={`${from}:${object.id}`} d={object.transport === 'ferry' ? 'M18 18 C-1 22 -1 46 18 50' : from === 'archive' || to === 'archive' ? 'M18 18 Q-12 50 18 82' : object.transport === 'lift' ? 'M18 18 Q50 -12 82 18' : `M${REGION_POINTS[from].join(' ')} L${REGION_POINTS[to].join(' ')}`} className={`${locked ? 'is-locked' : ''} ${routeEdges.has([from, to].sort().join(':')) && !locked && (from !== state.locationId && to !== state.locationId || route.next?.requiresFlag === object.requiresFlag) ? 'is-tracked' : ''}`} />)}</svg>
      {outdoorRegions.map(entry => <button key={entry.id} aria-label={`Track ${entry.name}`} aria-pressed={entry.id === target?.regionId && !target?.objectId} onClick={() => { setSelectedId(entry.id); onTrack({ regionId: entry.id }); }} style={{ left: `${REGION_POINTS[entry.id][0]}%`, top: `${REGION_POINTS[entry.id][1]}%` }}><strong>{entry.name}</strong><span>{entry.id === (ADVENTURE_REGIONS[state.locationId].parentRegion || state.locationId) ? 'You are here' : state.discoveries.includes(entry.id) ? 'Visited' : 'Unexplored'}</span></button>)}
    </nav>
    <p className="journey-map-connections">Valley route diagram · dashed paths are locked · gold paths lead to your destination.</p>
    {route && <div className="journey-map-tracking"><p><strong>Tracking: {route.name}</strong><br />{route.blocked ? 'No open route yet. Quiet the Static Wisp to enter the Archive.' : route.arrived ? 'You have reached this destination.' : route.path.map(id => ADVENTURE_REGIONS[id].name).join(' → ')}</p><button className="journey-button" onClick={onClear}>Clear destination</button></div>}
    <section className="journey-map-projects" aria-label="Valley projects"><h3>Change the valley</h3>{projects.map(project => <article key={project.id}><div><strong>{project.name}{project.complete ? ' · Open' : ''}</strong><p>{project.complete ? project.benefit : project.objective}</p>{!project.complete && <small>{project.benefit}</small>}</div>{!project.complete && <button className="journey-button" onClick={() => onTrack({ regionId: project.regionId, objectId: project.objectId })}>Track next step</button>}</article>)}</section>

    {rooms.length > 0 && state.discoveries.includes(parentId) && <details className="journey-map-rooms" open={region.outdoor === false}><summary>Homes & places to enter</summary><div className="journey-map-tabs">{rooms.map(room => <button key={room.id} aria-pressed={room.id === selectedId} onClick={() => setSelectedId(room.id)}>{room.name}{state.discoveries.includes(room.id) ? ' · Visited' : ''}</button>)}</div></details>}
    <h3>{region.name}</h3><div className="journey-inline-actions"><button className="journey-button is-primary" aria-pressed={target?.regionId === selectedId && !target?.objectId} onClick={() => onTrack({ regionId: selectedId })}>Track {region.name}</button></div><p className="journey-muted">{region.subtitle} · {outdoorRegions.filter(entry => state.discoveries.includes(entry.id)).length}/{outdoorRegions.length} outdoor regions visited</p>
    <p className="journey-map-connections">Paths to {exits.map(object => `${ADVENTURE_REGIONS[object.to].name}${exitLocked(state, object) ? ' (locked)' : ''}`).join(' · ')}</p>
    {region.districts && <p>Neighborhoods: {region.districts.map(area => area.name).join(' · ')}.</p>}
    {visited ? <div className="journey-tile-map" style={{ gridTemplateColumns: `repeat(${region.width}, 1fr)` }} role="img" aria-label={`${region.name} route map. Gold diamonds mark landmarks; dark blocks are buildings and trees.${selectedId === state.locationId ? ` You are at column ${state.x}, row ${state.y}.` : ''}`}>
      {Array.from({ length: region.width * region.height }, (_, index) => {
        const x = index % region.width; const y = Math.floor(index / region.width);
        const solid = x === 0 || y === 0 || x === region.width - 1 || y === region.height - 1 || region.solid.some(r => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h);
        const path = region.path.some(r => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h);
        const object = objects.find(entry => entry.x === x && entry.y === y);
        const surface = terrainAt(selectedId, x, y);
        const traversal = region.traversals?.find(link => link.from.x === x && link.from.y === y);
        const player = selectedId === state.locationId && state.x === x && state.y === y;
        return <span aria-hidden="true" key={index} className={`is-${surface} ${solid ? 'is-solid' : path && surface !== 'water' && surface !== 'bridge' ? 'is-path' : ''} ${object ? 'is-landmark' : ''} ${object?.type === 'exit' ? 'is-gate' : ''} ${traversal ? 'is-traversal' : ''} ${player ? 'is-player' : ''}`} title={player ? 'You are here' : object?.name || traversal?.label} />;
      })}
    </div> : <div className="journey-unexplored-map"><span aria-hidden="true">◇</span><p>This part of the field map is still folded. Visit the region to reveal its paths.</p></div>}
    <p className="journey-map-legend"><span><i className="is-player" /> You</span><span><i className="is-landmark" /> Landmark</span><span><i className="is-gate" /> Gateway</span><span><i className="is-water" /> Deep water</span><span><i className="is-bridge" /> Crossing</span><span><i className="is-traversal" /> Jump / climb / ledge</span><span><i className="is-solid" /> Building / trees</span></p>
    {visited && <ul className="journey-map-landmarks" aria-label={`${region.name} landmarks`}>{landmarks.map(object => <li key={object.id}><button className="journey-landmark-target" aria-pressed={target?.regionId === selectedId && target?.objectId === object.id} onClick={() => onTrack({ regionId: selectedId, objectId: object.id })}><strong>{object.name}</strong><span>Track · Column {object.x}, row {object.y}</span></button></li>)}</ul>}
    {visited && region.traversals?.length > 0 && <p>Stand at a marked crossing, face the far side and press Space or the traversal button. Climbing holds and one-way ledges are marked in the field.</p>}
    {visited && region.traversals?.length > 0 && <ul className="journey-map-landmarks" aria-label={`${region.name} traversal routes`}>{region.traversals.map(link => <li key={link.id}><strong>{link.label || link.kind}</strong><span>Column {link.from.x}, row {link.from.y} · Face {link.facing}</span></li>)}</ul>}
    <p>{region.routeHint || (selectedId === 'sunward' ? `From the western trailhead, the northern ridge reaches the Wind Marker and old lookout. ${state.flags.overlookFound ? 'The southern memorial road reaches Lantern Overlook.' : 'The southern memorial road loops back toward the eastern ridge.'} Both roads meet in the east.` : 'East from town: Moss Circuit. South from town: the Archive. The eastern trail in Moss Circuit reaches Sunward Pass; the orchard footpath joins the valley loop.')} Stand beside a gateway and Interact to travel.</p>
    {discoveries.length > 0 && <p className="journey-muted">Recorded here: {discoveries.map(object => object.name).join(' · ')}.</p>}
    {optional && <p className="journey-muted">{optional}</p>}
    {selectedId === 'sunward' && state.flags.overlookFound && <p>Discovery recorded: Lantern Overlook.</p>}
  </div>;
}
