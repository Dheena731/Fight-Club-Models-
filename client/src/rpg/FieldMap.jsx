import { useState } from 'react';
import { ADVENTURE_REGIONS } from '../../../shared/rpg/adventureContent.js';
import { regionObjects, sideObjective } from '../../../shared/rpg/adventure.js';

export default function FieldMap({ state }) {
  const [selectedId, setSelectedId] = useState(state.locationId);
  const region = ADVENTURE_REGIONS[selectedId];
  const visited = state.discoveries.includes(selectedId);
  const objects = regionObjects({ ...state, locationId: selectedId }).filter(object => object.id !== 'sunward-overlook' || state.flags.overlookFound);
  const optional = sideObjective(state);
  return <div className="journey-field-map">
    <nav className="journey-map-tabs" aria-label="Inspect a region">{Object.values(ADVENTURE_REGIONS).map(entry => <button key={entry.id} aria-pressed={entry.id === selectedId} onClick={() => setSelectedId(entry.id)}>{entry.name}{entry.id === state.locationId ? ' · You' : ''}</button>)}</nav>
    <h3>{region.name}</h3><p className="journey-muted">{region.subtitle} · {state.discoveries.length}/{Object.keys(ADVENTURE_REGIONS).length} regions visited</p>
    {visited ? <div className="journey-tile-map" style={{ gridTemplateColumns: `repeat(${region.width}, 1fr)` }} role="img" aria-label={`${region.name} route map. Gold diamonds mark landmarks; dark blocks are buildings and trees.${selectedId === state.locationId ? ` You are at column ${state.x}, row ${state.y}.` : ''}`}>
      {Array.from({ length: region.width * region.height }, (_, index) => {
        const x = index % region.width; const y = Math.floor(index / region.width);
        const solid = x === 0 || y === 0 || x === region.width - 1 || y === region.height - 1 || region.solid.some(r => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h);
        const path = region.path.some(r => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h);
        const object = objects.find(entry => entry.x === x && entry.y === y);
        const player = selectedId === state.locationId && state.x === x && state.y === y;
        return <span aria-hidden="true" key={index} className={`${solid ? 'is-solid' : path ? 'is-path' : ''} ${object ? 'is-landmark' : ''} ${object?.type === 'exit' ? 'is-gate' : ''} ${player ? 'is-player' : ''}`} title={player ? 'You are here' : object?.name} />;
      })}
    </div> : <div className="journey-unexplored-map"><span aria-hidden="true">◇</span><p>This part of the field map is still folded. Visit the region to reveal its paths.</p></div>}
    <p className="journey-map-legend"><span><i className="is-player" /> You</span><span><i className="is-landmark" /> Landmark</span><span><i className="is-gate" /> Gateway</span><span><i className="is-solid" /> Building / trees</span></p>
    {visited && <ul className="journey-map-landmarks" aria-label={`${region.name} landmarks`}>{objects.filter(object => object.type !== 'enemy' && object.type !== 'pickup').map(object => <li key={object.id}><strong>{object.name}</strong><span>Column {object.x}, row {object.y}</span></li>)}</ul>}
    <p>{selectedId === 'sunward' ? `From the western trailhead, the northern ridge reaches the Wind Marker and old lookout. ${state.flags.overlookFound ? 'The southern memorial road reaches Lantern Overlook.' : 'The southern memorial road loops back toward the eastern ridge.'} Both roads meet in the east.` : 'East from town: Moss Circuit. South from town: the Archive. Past the Wisp, the eastern trail in Moss Circuit opens into Sunward Pass.'} Stand beside a gateway and Interact to travel.</p>
    {optional && <p className="journey-muted">{optional}</p>}
    {selectedId === 'sunward' && state.flags.overlookFound && <p>Discovery recorded: Lantern Overlook.</p>}
  </div>;
}
