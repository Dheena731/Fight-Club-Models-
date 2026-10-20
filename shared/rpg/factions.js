// Original fictional factions. Provider research inspires themes, never combat metrics.
export const FACTIONS = {
  wardens: {
    id: 'wardens', name: 'Wardens', heroId: 'owl', allyId: 'guide', allyName: 'Mara',
    regionId: 'frontier', sourceId: 'constitutional-ai',
    scene: 'A lantern sputters above the Warden hall. Mara has kept its records safe, but the signal beyond the crossing is fading.',
    promise: 'Protect what the frontier remembers.',
    choices: [
      { id: 'safeguard', name: 'Safeguard the record', objective: 'Read the Relay Notes in the Forgotten Archive, then report to Mara.',
        hint: 'Find the old notes south of town.', item: 'Warden Seal', reward: 'Ward blocks 2 more damage.', bonus: { guard: 2 } },
      { id: 'beacon', name: 'Carry the signal', objective: 'Recover the Signal Shard in Moss Circuit, then report to Mara.',
        hint: 'Find the shard east of town.', item: 'Beacon Crest', reward: 'Signal Strike deals 2 more damage.', bonus: { strike: 2 } },
    ],
  },
  guild: {
    id: 'guild', name: 'Research Guild', heroId: 'fox', allyId: 'ranger', allyName: 'Ivo',
    regionId: 'grove', sourceId: 'few-shot-learning',
    scene: 'A field camp waits among the mossy wires. Ivo has two theories about the dead circuit, and only one traveler to test them.',
    promise: 'Follow evidence through the unknown.',
    choices: [
      { id: 'survey', name: 'Survey the old routes', objective: 'Reach the Forgotten Archive, then return to Ivo in Moss Circuit.',
        hint: 'The archive entrance is southwest of Frontier Crossing.', item: 'Survey Lens', reward: 'Reveal the three-region map.', bonus: { revealMap: true } },
      { id: 'salvage', name: 'Salvage the shard', objective: 'Recover the Signal Shard in Moss Circuit, then return to Ivo.',
        hint: 'Follow the pale path to the southeastern shard.', item: 'Circuit Tool', reward: 'Overcharge deals 2 more damage.', bonus: { pulse: 2 } },
    ],
  },
  observatory: {
    id: 'observatory', name: 'Observatory', heroId: 'serpent', allyId: 'scholar', allyName: 'Neri',
    regionId: 'archive', sourceId: 'transformer',
    scene: 'Pale relay light flickers over the archive shelves. Neri invites you to trace the pattern behind the failing signal.',
    promise: 'Find patterns others overlook.',
    choices: [
      { id: 'decode', name: 'Decode the relay', objective: 'Read the Relay Notes here in the Forgotten Archive, then report to Neri.',
        hint: 'Inspect the notes west of Neri.', item: 'Cipher Charm', reward: 'Ward blocks 2 more damage.', bonus: { guard: 2 } },
      { id: 'quiet', name: 'Study the static', objective: 'Defeat the Static Wisp in Moss Circuit, then report to Neri.',
        hint: 'The Wisp waits on the eastern Moss Circuit path.', item: 'Static Prism', reward: 'Signal Strike deals 2 more damage.', bonus: { strike: 2 } },
    ],
  },
};

export const FACTION_ITEMS = Object.values(FACTIONS).flatMap((faction) => faction.choices.map((choice) => choice.item));

export function factionForHero(heroId) {
  return Object.values(FACTIONS).find((faction) => faction.heroId === heroId) || FACTIONS.wardens;
}

export function selectedChoice(state) {
  const faction = factionForHero(state.heroId);
  return faction.choices.find((choice) => choice.id === state.faction?.choice) || null;
}

export function factionRequirementMet(state) {
  const choice = selectedChoice(state);
  if (!choice) return false;
  if (choice.id === 'safeguard' || choice.id === 'decode') return state.flags.noteRead;
  if (choice.id === 'beacon' || choice.id === 'salvage') return state.flags.shardFound;
  if (choice.id === 'survey') return state.discoveries.includes('archive');
  if (choice.id === 'quiet') return state.flags.wispDefeated;
  return false;
}

export function factionObjective(state) {
  const faction = factionForHero(state.heroId);
  const choice = selectedChoice(state);
  if (!choice) return `Choose ${faction.name === 'Observatory' ? 'an' : 'a'} ${faction.name} mandate.`;
  return state.faction.completed ? `${choice.name} complete. ${faction.allyName} stands with you.` : choice.objective;
}
