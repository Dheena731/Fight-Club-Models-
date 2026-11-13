const step = (flag, regionId, objectId, objective) => ({ flag, regionId, objectId, objective });
export const VALLEY_PROJECTS = [
  { id: 'grove', regionId: 'grove', name: 'Moss Circuit', description: 'An old circuit lies beneath the grove’s roots. Read its inscription and wake the sentinel to restore its living pattern.', flag: 'groveStamp', steps: [step('groveInscription', 'grove', 'grove-inscription', 'Read the inscription beside the central trail.'), step('groveDial', 'grove', 'grove-dial', 'Set the moss dial farther east on the trail.'), step('groveStamp', 'grove', 'bramble-sentinel', 'Meet the Bramble Sentinel east of the dial.')] },
  { id: 'sunward', regionId: 'sunward', name: 'Sunward Light', description: 'The ridge keepers once measured a whole day of light. Restore their heliograph to record Sunward’s place in the Almanac.', flag: 'sunwardStamp', steps: [step('dawnEtching', 'sunward', 'dawn-etching', 'Read the etching on the northern ridge road.'), step('sunwardStamp', 'sunward', 'heliograph', 'Set the heliograph farther east along the ridge.')] },
  { id: 'riverlands', regionId: 'riverlands', name: 'River Sluices', description: 'The mill depends on a steady river. Follow the ledger to open both gates and calm the guardian of the flow.', flag: 'riverStamp', steps: [step('sluiceLedger', 'riverlands', 'sluice-ledger', 'Inspect the ledger on the southern road west of the river.'), step('upstreamOpen', 'riverlands', 'upstream-gate', 'Open the upstream gate beside the northern bridge.'), step('downstreamOpen', 'riverlands', 'downstream-gate', 'Cross the southern bridge and open the downstream gate.'), step('riverStamp', 'riverlands', 'tideglass-crab', 'Find the Tideglass Navigator farther east along the road.')] },
  { id: 'orchard', regionId: 'orchard', name: 'Pollinator Garden', description: 'The orchard’s hive needs help feeding its pollinators. Carry pollen from the blossom bed back to the hive to restore the garden.', flag: 'orchardStamp', steps: [step('pollinatorRequest', 'orchard', 'orchard-beehive', 'Read the request at the beehive near the western orchard road.'), step('pollenCollected', 'orchard', 'blossom-bed', 'Collect pollen at the blossom bed east of the hive.'), step('orchardStamp', 'orchard', 'orchard-beehive', 'Return pollen to the beehive.')] },
  { id: 'highlands', regionId: 'highlands', name: 'Starfall Chart', description: 'The old astronomers mapped a constellation in the highlands. Follow their chart to awaken the guardian beneath the stars.', flag: 'highlandsStamp', steps: [step('starChart', 'highlands', 'star-chart', 'Read the star chart west of the Sunward trailhead.'), step('constellation', 'highlands', 'star-crater', 'Trace the constellation at the crater farther west.'), step('highlandsStamp', 'highlands', 'starfall-ram', 'Meet the Starfall Bull west of the crater.')] },
];
export const VALLEY_FLAG_IDS = [...VALLEY_PROJECTS.flatMap(project => project.steps.map(stage => stage.flag)), 'valleyComplete'];
const puzzle = (id, title, clue, sequence, flag, requires, text) => ({ id, title, clue, choices: [sequence[2], sequence[0], sequence[1]].map(id => ({ id, name: id[0].toUpperCase() + id.slice(1) })), sequence, flag, requires, text });
export const VALLEY_PUZZLES = {
  grove: puzzle('grove', 'Moss Dial', 'Recall the pattern on the circuit inscription.', ['root', 'leaf', 'bloom'], 'groveDial', ['groveInscription'], 'The dial wakes the roots. The Bramble Sentinel is ready.'),
  sunward: puzzle('sunward', 'Heliograph', 'Recall the day’s path from the dawn etching.', ['dawn', 'zenith', 'dusk'], 'sunwardStamp', ['dawnEtching'], 'The heliograph catches the whole day. Sunward stamp earned; the team gains 20 XP.'),
  highlands: puzzle('highlands', 'Star Crater', 'Recall the constellation on the star chart.', ['spark', 'trail', 'crown'], 'constellation', ['starChart'], 'The constellation shines. The Starfall Bull is ready.'),
};

export function expandValleyWorld(regions) {
  const add = (region, id, x, y, name, appearance, extra = {}) => regions[region].objects.push({ id, x, y, name, appearance, type: 'lore', passable: true, color: '#b7c695', ...extra });
  add('frontier', 'almanac-board', 15, 11, 'Valley Almanac', 'almanac-board', { valleyBoard: true });
  add('frontier', 'festival-lantern', 16, 11, 'Festival Lantern', 'festival-lantern', { valleyFinale: true });
  add('grove', 'grove-inscription', 12, 10, 'Circuit Inscription', 'moss-dial', { task: { flag: 'groveInscription', requires: [], text: 'The circuit grows in order: root, leaf, bloom.' } });
  add('grove', 'grove-dial', 15, 10, 'Moss Dial', 'moss-dial', { valleyPuzzle: 'grove' });
  add('grove', 'bramble-sentinel', 18, 10, 'Bramble Sentinel', 'moss-dial', { type: 'enemy', encounterId: 'bramble-sentinel', requires: ['groveDial'], hiddenFlag: 'groveStamp' });
  add('sunward', 'dawn-etching', 15, 7, 'Dawn Etching', 'heliograph', { task: { flag: 'dawnEtching', requires: [], text: 'The sun travels from dawn to zenith to dusk.' } });
  add('sunward', 'heliograph', 22, 7, 'Heliograph', 'heliograph', { valleyPuzzle: 'sunward' });
  add('riverlands', 'sluice-ledger', 17, 29, 'Sluice Ledger', 'sluice', { task: { flag: 'sluiceLedger', requires: [], text: 'Open the upstream gate, then the downstream gate, to restore the flow.' } });
  add('riverlands', 'upstream-gate', 23, 14, 'Upstream Gate', 'sluice', { task: { flag: 'upstreamOpen', requires: ['sluiceLedger'], blockedText: 'Read the sluice ledger first.', text: 'The upstream gate opens.' } });
  add('riverlands', 'downstream-gate', 32, 28, 'Downstream Gate', 'sluice', { task: { flag: 'downstreamOpen', requires: ['sluiceLedger', 'upstreamOpen'], blockedText: 'Open the upstream gate first.', text: 'The downstream gate opens. The Tideglass Navigator emerges.' } });
  add('riverlands', 'tideglass-crab', 45, 29, 'Tideglass Navigator', 'sluice', { type: 'enemy', encounterId: 'tideglass-crab', requires: ['downstreamOpen'], hiddenFlag: 'riverStamp' });
  add('orchard', 'orchard-beehive', 10, 26, 'Orchard Beehive', 'beehive', { valleyHive: true });
  add('orchard', 'blossom-bed', 15, 26, 'Blossom Bed', 'beehive', { task: { flag: 'pollenCollected', requires: ['pollinatorRequest'], blockedText: 'Visit the beehive first.', text: 'You collect pollen for the hive.' } });
  add('highlands', 'star-chart', 42, 32, 'Star Chart', 'star-crater', { task: { flag: 'starChart', requires: [], text: 'Trace the constellation: spark, trail, crown.' } });
  add('highlands', 'star-crater', 38, 32, 'Star Crater', 'star-crater', { valleyPuzzle: 'highlands' });
  add('highlands', 'starfall-ram', 34, 32, 'Starfall Bull', 'star-crater', { type: 'enemy', encounterId: 'starfall-ram', requires: ['constellation'], hiddenFlag: 'highlandsStamp' });
}
