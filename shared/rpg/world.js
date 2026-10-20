// Original fiction for the first AI Frontier chapter. Coordinates are tile units.
export const TILE = 32;
export const WORLD_SIZE = { width: 20, height: 12 };

export const HEROES = [
  { id: 'owl', name: 'The Archivist', factionId: 'wardens', faction: 'Wardens', color: '#d97757', style: 'Safeguard the record' },
  { id: 'fox', name: 'The Pathfinder', factionId: 'guild', faction: 'Research Guild', color: '#45c6a5', style: 'Follow the field evidence' },
  { id: 'serpent', name: 'The Stargazer', factionId: 'observatory', faction: 'Observatory', color: '#77adff', style: 'Decode hidden patterns' },
];

export const REGIONS = {
  frontier: {
    id: 'frontier', name: 'Frontier Crossing', subtitle: 'A lantern town at the edge of the signal',
    palette: { ground: '#192c39', alt: '#203644', path: '#46565b', edge: '#091722', wall: '#344357', glow: '#f9c56d' },
    spawn: { x: 9, y: 7 },
    path: [{ x: 0, y: 6, w: 20, h: 2 }, { x: 4, y: 3, w: 2, h: 7 }, { x: 14, y: 3, w: 2, h: 7 }],
    solid: [{ x: 2, y: 2, w: 6, h: 2 }, { x: 12, y: 2, w: 6, h: 2 }, { x: 8, y: 9, w: 4, h: 2 }],
    objects: [
      { id: 'guide', type: 'npc', x: 5, y: 5, name: 'Mara the Keeper', color: '#f0ab6c' },
      { id: 'lantern', type: 'landmark', x: 10, y: 5, name: 'Relay Lantern', color: '#f9c56d' },
      { id: 'arena', type: 'arena', x: 15, y: 5, name: 'Frontier Arena', color: '#e97677' },
      { id: 'grove-gate', type: 'exit', x: 18, y: 6, name: 'Moss Circuit', to: 'grove', entry: { x: 2, y: 6 }, color: '#74c9a9' },
      { id: 'archive-gate', type: 'exit', x: 4, y: 9, name: 'Forgotten Archive', to: 'archive', entry: { x: 16, y: 8 }, color: '#a695e9' },
    ],
  },
  grove: {
    id: 'grove', name: 'Moss Circuit', subtitle: 'Wires and roots weave through old stone',
    palette: { ground: '#16352f', alt: '#1b4038', path: '#53634f', edge: '#071c1a', wall: '#306251', glow: '#8af4c2' },
    spawn: { x: 2, y: 6 },
    path: [{ x: 0, y: 5, w: 20, h: 3 }, { x: 12, y: 5, w: 2, h: 5 }],
    solid: [{ x: 4, y: 2, w: 3, h: 2 }, { x: 9, y: 2, w: 2, h: 2 }, { x: 15, y: 8, w: 3, h: 2 }],
    objects: [
      { id: 'frontier-gate', type: 'exit', x: 1, y: 6, name: 'Frontier Crossing', to: 'frontier', entry: { x: 17, y: 6 }, color: '#f9c56d' },
      { id: 'ranger', type: 'npc', x: 6, y: 5, name: 'Ivo the Scout', color: '#9be5a7' },
      { id: 'shard', type: 'pickup', x: 13, y: 9, name: 'Signal Shard', color: '#b7f5e0' },
      { id: 'static', type: 'enemy', x: 16, y: 5, name: 'Static Wisp', color: '#f07fb5' },
    ],
  },
  archive: {
    id: 'archive', name: 'Forgotten Archive', subtitle: 'The shelves remember what the lamps forgot',
    palette: { ground: '#28233d', alt: '#312b49', path: '#57516c', edge: '#110f20', wall: '#4d4264', glow: '#a7dbff' },
    spawn: { x: 16, y: 8 },
    path: [{ x: 2, y: 7, w: 16, h: 2 }, { x: 9, y: 3, w: 2, h: 6 }],
    solid: [{ x: 3, y: 2, w: 4, h: 2 }, { x: 13, y: 2, w: 4, h: 2 }, { x: 3, y: 5, w: 3, h: 1 }, { x: 14, y: 5, w: 3, h: 1 }],
    objects: [
      { id: 'frontier-gate', type: 'exit', x: 18, y: 8, name: 'Frontier Crossing', to: 'frontier', entry: { x: 4, y: 8 }, color: '#f9c56d' },
      { id: 'archive-note', type: 'lore', x: 7, y: 7, name: 'Relay Notes', color: '#ece2b7' },
      { id: 'relay', type: 'puzzle', x: 10, y: 5, name: 'Archive Relay', color: '#9ed6fa' },
      { id: 'scholar', type: 'npc', x: 12, y: 8, name: 'Neri the Scholar', color: '#c8b6f6' },
    ],
  },
};

export const CHAPTER = {
  id: 'lantern-signal',
  name: 'The Lantern Signal',
  steps: [
    'Ask Mara about the dark relay lantern.',
    'Find the Signal Shard in Moss Circuit.',
    'Defeat the Static Wisp in Moss Circuit.',
    'Read the relay notes and restore the Archive Relay.',
    'Return to Mara in Frontier Crossing.',
  ],
};

export const ABILITIES = [
  { id: 'strike', name: 'Signal Strike', cost: 0, damage: 7, guard: 0, description: 'A reliable attack. Restore 1 energy.' },
  { id: 'pulse', name: 'Overcharge', cost: 2, damage: 14, guard: 0, description: 'A heavy strike that costs 2 energy.' },
  { id: 'guard', name: 'Ward', cost: 0, damage: 3, guard: 7, description: 'Block 7 damage and restore 1 energy.' },
];
