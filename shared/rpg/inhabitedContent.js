export const TOWN_FLAG_IDS = ['breadRequested', 'breadCollected', 'breadDelivered', 'wheelRequested', 'bearingReady', 'wheelRepaired', 'recipeRequested', 'recipeFound', 'recipeReturned'];

export const TOWN_QUESTS = [
  { id: 'watch-supper', name: 'Bread for the Night Watch', stages: [
    { flag: 'breadRequested', objective: 'Read the supper order inside Riverside Kitchen, east of Makers’ Yard.' },
    { flag: 'breadCollected', objective: 'Collect the reserved flour inside Toma’s watermill in Amber Riverlands.' },
    { flag: 'breadDelivered', objective: 'Bring the flour to Ada inside the Copper Kettle Inn on Market Street.' },
  ] },
  { id: 'mill-repair', name: 'A Wheel for Tomorrow', stages: [
    { flag: 'wheelRequested', objective: 'Inspect the maintenance ledger inside Amber Watermill.' },
    { flag: 'bearingReady', objective: 'Ask Rusk for the fitted bearing inside Lantern Workshop in Makers’ Yard.' },
    { flag: 'wheelRepaired', objective: 'Fit the bearing at the watermill’s inspection hatch.' },
  ] },
  { id: 'orchard-recipe', name: 'The Missing Orchard Recipe', stages: [
    { flag: 'recipeRequested', objective: 'Read Fern’s recipe request inside Glassleaf House on Hearth Row.' },
    { flag: 'recipeFound', objective: 'Look in the blue cottage’s porch basket in Hearthbloom Orchard.' },
    { flag: 'recipeReturned', objective: 'Return the recipe to Fern at her kitchen table inside Glassleaf House.' },
  ] },
];

const furniture = (art, x, y, w = 1, h = 1) => ({ kind: 'furniture', art, x, y, w, h });
const prop = (kind, x, y, w = 1, h = 1) => ({ kind, x, y, w, h });
const resident = (id, name, x, y, text, activity, npcFrame = 2, tint = '#ffffff') => ({ id, type: 'npc', name, x, y, text, activity, npcFrame, tint });
const inspect = (id, name, appearance, x, y, text) => ({ id, type: 'lore', name, appearance, x, y, text });
const task = (flag, requires, text, blockedText, completedText, reward) => ({ flag, requires, text, blockedText, completedText, ...(reward ? { reward } : {}) });

function room(id, name, parentRegion, returnPoint, width, height, floor, solid, decorations, objects) {
  const x = Math.floor(width / 2);
  return {
    id, name, subtitle: 'An open door on the Keeper’s Trail', outdoor: false, parentRegion,
    biome: 'interior', flooring: floor, width, height, spawn: { x, y: height - 3 },
    fieldPalette: { grass: '#ac8c65', grass2: '#b99c77', path: '#bb9a70', dark: '#594d43', light: '#f0d4a5' },
    path: [], terrain: [{ kind: floor, x: 1, y: 1, w: width - 2, h: height - 2 }],
    solid, decorations,
    objects: [{ id: `${id}-exit`, type: 'exit', appearance: 'door', passable: true, x, y: height - 2, name: 'Step outside', to: parentRegion, entry: returnPoint }, ...objects],
    routeHint: 'The open door at the bottom of the room returns to the street. Speak to the residents and inspect their work.',
  };
}

export function expandInhabitedWorld(regions) {
  const town = regions.frontier;
  town.width = 64;
  town.height = 48;
  town.spawn = { x: 46, y: 10 };
  town.subtitle = 'Market streets, lived-in homes and workshops beside the keeper’s old square';
  town.routeHint = 'The old square leads east to Market Street. Head south through Hearth Row for the homes and common garden, or follow the east avenue to Makers’ Yard and Riverside Kitchen. The southern lane links the working yards and canal. Open doors lead indoors; the original Moss Circuit and Archive gateways remain beside the old square.';
  town.districts = [
    { id: 'old-crossing', name: 'Lantern Crossing', x: 0, y: 0, w: 28, h: 18 },
    { id: 'market-street', name: 'Market Street', x: 28, y: 0, w: 36, h: 21 },
    { id: 'hearth-row', name: 'Hearth Row', x: 0, y: 18, w: 29, h: 20 },
    { id: 'makers-yard', name: 'Makers’ Yard', x: 29, y: 21, w: 20, h: 17 },
    { id: 'riverside-gardens', name: 'Riverside Gardens', x: 49, y: 21, w: 15, h: 27 },
    { id: 'south-lane', name: 'South Working Lane', x: 0, y: 38, w: 49, h: 10 },
  ];
  // Keep the old footprint and its collision exactly; new streets start beyond it.
  town.path.push(
    { x: 27, y: 9, w: 35, h: 3 }, { x: 29, y: 9, w: 3, h: 37 },
    { x: 3, y: 18, w: 59, h: 3 }, { x: 12, y: 17, w: 3, h: 6 },
    { x: 3, y: 28, w: 44, h: 3 }, { x: 3, y: 36, w: 59, h: 3 },
    { x: 3, y: 44, w: 59, h: 2 }, { x: 3, y: 20, w: 2, h: 26 },
    { x: 45, y: 11, w: 3, h: 35 }, { x: 60, y: 10, w: 2, h: 35 },
    { x: 32, y: 16, w: 29, h: 2 }, { x: 52, y: 29, w: 9, h: 3 },
  );
  town.terrain = [
    ...(town.terrain || []),
    { kind: 'stone', x: 32, y: 9, w: 29, h: 9 },
    { kind: 'stone', x: 33, y: 29, w: 12, h: 7 },
    { kind: 'dirt', x: 54, y: 33, w: 6, h: 9 },
    { kind: 'sand', x: 48, y: 31, w: 5, h: 16 },
    { kind: 'water', x: 49, y: 31, w: 3, h: 16 },
    { kind: 'bridge', x: 48, y: 36, w: 5, h: 3 },
    { kind: 'bridge', x: 48, y: 44, w: 5, h: 2 },
    { kind: 'wood', x: 47, y: 40, w: 3, h: 3 },
  ];
  Object.assign(town.solid[0], { kind: 'building', art: 'townhouse', name: 'Old Keeper Hall', tint: '#e7d7b1' });
  Object.assign(town.solid[1], { kind: 'building', art: 'smithy', name: 'Crossing Arena Lodge', tint: '#c8d4df' });
  Object.assign(town.solid[2], { kind: 'building', art: 'barn', name: 'Relay Storehouse', tint: '#d9c39f' });
  town.solid.push(
    { kind: 'building', art: 'inn', name: '1 Market Street · Copper Kettle Inn', x: 33, y: 3, w: 9, h: 6 },
    { kind: 'building', art: 'townhouse', name: '2 Market Street · Field Clinic', x: 45, y: 3, w: 7, h: 5, tint: '#d1e7d7' },
    { kind: 'building', art: 'shop', name: '3 Market Street · Miri’s Provisions', x: 54, y: 3, w: 7, h: 6 },
    { kind: 'building', art: 'townhouse', name: '1 Hearth Row · Weaver’s House', x: 3, y: 23, w: 7, h: 5, tint: '#c3d7ed' },
    { kind: 'building', art: 'cottage', name: '2 Hearth Row · Keeper’s Cottage', x: 14, y: 23, w: 7, h: 5, tint: '#efd2ae' },
    { kind: 'building', art: 'greenhouse', name: '3 Hearth Row · Glassleaf House', x: 23, y: 23, w: 6, h: 5 },
    { kind: 'building', art: 'smithy', name: '1 Makers’ Yard · Lantern Workshop', x: 34, y: 23, w: 10, h: 6 },
    { kind: 'building', art: 'inn', name: '1 Riverside Lane · Riverside Kitchen', x: 53, y: 23, w: 8, h: 6, tint: '#ead7b7' },
    { kind: 'building', art: 'barn', name: '1 South Lane · Pack Stable', x: 4, y: 39, w: 7, h: 5, tint: '#d7c7b1' },
    { kind: 'building', art: 'shop', name: '2 South Lane · Wash House', x: 15, y: 39, w: 6, h: 5, tint: '#c5dada' },
    { kind: 'building', art: 'smithy', name: '3 South Lane · Clay & Kiln', x: 25, y: 39, w: 6, h: 5, tint: '#dfb797' },
    { kind: 'building', art: 'barn', name: '4 South Lane · Canal Boathouse', x: 36, y: 39, w: 8, h: 5, tint: '#b7ced6' },
    furniture('stall', 34, 13, 3, 2), furniture('stall', 40, 13, 3, 2),
    furniture('stall', 51, 13, 3, 2), furniture('stall', 57, 13, 3, 2),
    furniture('fountain', 45, 13, 3, 3), furniture('well', 17, 32, 2, 2),
    furniture('cart', 34, 33, 3, 2), furniture('logs', 40, 33, 3, 2),
  );
  town.decorations = [...(town.decorations || []),
    prop('flowers', 33, 2, 8), prop('flowers', 45, 2, 6), prop('pot', 43, 7), prop('pot', 52, 7),
    prop('bench', 43, 16), prop('bench', 49, 16), prop('cart', 58, 18, 2),
    prop('barrel', 33, 7), prop('barrel', 61, 14), prop('basket', 38, 14), prop('basket', 55, 14),
    prop('pot', 34, 16), prop('pot', 59, 16), prop('crate', 55, 11), prop('crate', 56, 11),
    prop('flowers', 5, 21, 5), prop('flowers', 15, 21, 6), prop('flowers', 24, 21, 4),
    prop('mailbox', 4, 28), prop('mailbox', 15, 28), prop('mailbox', 23, 28),
    prop('pot', 10, 27), prop('pot', 21, 27), prop('planter', 27, 29, 2),
    prop('clothesline', 6, 32, 6, 2), prop('basket', 6, 34), prop('basket', 11, 34),
    prop('bench', 14, 33), prop('bench', 22, 33), prop('flowers', 24, 32, 3, 3),
    prop('fence', 5, 35, 8), prop('fence', 21, 35, 7), prop('pot', 16, 34),
    prop('anvil', 35, 30), prop('barrel', 43, 30), prop('crate', 43, 32),
    prop('crate', 42, 32), prop('logs', 35, 21, 4), prop('pot', 54, 29),
    prop('basket', 59, 30), prop('barrel', 61, 28), prop('clothesline', 53, 21, 7),
    prop('crop', 54, 33, 6), prop('crop', 54, 35, 6), prop('crop', 54, 39, 6), prop('crop', 54, 41, 6),
    prop('fence', 53, 32, 7), prop('fence', 53, 43, 7), prop('basket', 59, 42),
    prop('reeds', 52, 39, 1, 4), prop('reeds', 48, 32, 1, 3), prop('boat', 50, 42, 2, 3),
    prop('dock', 47, 40, 3, 3), prop('barrel', 46, 42), prop('crate', 46, 40),
    prop('hay', 5, 37, 2), prop('hay', 9, 37, 2), prop('cart', 11, 41, 2),
    prop('clothesline', 15, 37, 6), prop('basket', 22, 43), prop('pot', 24, 37),
    prop('pot', 26, 37), prop('pot', 28, 37), prop('logs', 32, 41, 3),
    prop('barrel', 35, 43), prop('boat', 44, 39, 2, 3),
  ];
  const entrances = [
    ['crossing-inn', 'Copper Kettle Inn', 37, 9, 26, 20],
    ['field-clinic', 'Field Clinic', 48, 8, 22, 16],
    ['provision-shop', 'Miri’s Provisions', 57, 9, 22, 16],
    ['weaver-home', 'Weaver’s House', 6, 28, 20, 16],
    ['keeper-home', 'Keeper’s Cottage', 17, 28, 22, 16],
    ['gardener-home', 'Glassleaf House', 26, 28, 22, 18],
    ['lantern-workshop', 'Lantern Workshop', 39, 29, 24, 18],
    ['riverside-kitchen', 'Riverside Kitchen', 57, 29, 24, 18],
  ];
  for (const [id, name, x, y, width, height] of entrances) town.objects.push({ id: `${id}-door`, type: 'exit', appearance: 'door', passable: true, name: `Enter ${name}`, x, y, to: id, entry: { x: Math.floor(width / 2), y: height - 3 } });
  town.objects.push(
    resident('fishmonger', 'Jori · River Fish', 35, 15, 'Toma keeps the mill wheel clear, and I keep the supper pots full. The kitchen is down the east avenue. These fish came upstream in a covered cart this morning.', 'Wrapping the morning catch', 1, '#afc8dd'),
    resident('seed-seller', 'Pella · Seeds & Cuttings', 41, 15, 'The blue baskets hold beans, the shallow ones marigolds. Fern at Glassleaf House starts the seedlings; the beds along the canal feed the inn.', 'Sorting seed envelopes', 2, '#e3c4ab'),
    resident('fruit-seller', 'Nim · Hearthbloom Fruit', 52, 15, 'These apples came from Bela’s terraces. If the orchard feels far away, follow the river road southeast from the old square. Every roof along it has someone to visit.', 'Stacking apples into pyramids', 0, '#b9d9ae'),
    resident('mender', 'Osa · Buttons & Repairs', 58, 15, 'Linen goes to Elin on Hearth Row; cracked lamp frames go to Rusk in Makers’ Yard. I handle the troublesome things too small to have their own workshop.', 'Mending a traveler’s coat', 2, '#d8bddb'),
    inspect('market-fountain', 'Crossing Fountain', 'book', 44, 14, 'A brass plaque names the millers, growers and makers who laid the fountain pipes together. A small channel carries its overflow to the kitchen gardens.'),
    inspect('town-district-board', 'Crossing Street Plan', 'waystone', 30, 18, 'Market Street lies north: inn, clinic and provisions. Hearth Row lies west: three family homes and the common well. Makers’ Yard lies east. South Lane holds the stable, wash house, pottery and boat yard. Open doors can be entered.'),
    resident('well-keeper', 'Len · Common Well', 19, 33, 'The handle sticks if you rush it. Elin washes her dyed cloth here; Fern takes the rinse water for the plants. Leave the bucket full for whoever comes next.', 'Drawing water for the households', 1, '#bfced9'),
    resident('yard-apprentice', 'Kit · Workshop Apprentice', 38, 32, 'The cart is finally level. Rusk is inside fitting a new bearing for Toma’s mill. There is always an urgent little job hiding behind a big adventure.', 'Checking a wagon wheel', 0, '#d4ba9f'),
    resident('canal-grower', 'Aven · Allotment Keeper', 58, 40, 'Two rows for soup, two rows for the winter jars. There is a clean path between every bed; please use it. Fern’s greenhouse is back on Hearth Row.', 'Tying the bean stems', 1, '#b6ceac'),
    resident('stablehand', 'Dara · Pack Stable', 8, 45, 'The inn borrows our handcarts. Toma’s sacks ride in the broad one; Orrin’s telescope lenses go in the little one with the padded tray. I check every axle before they leave.', 'Brushing straw from a harness', 1, '#d4c3a5'),
    resident('launderer', 'Esme · Wash House', 18, 45, 'Clinic sheets first, tablecloths second, traveling coats when the wind gets up. Elin’s blue dye is the one color that never runs into the wash.', 'Folding sun-dried linen', 2, '#c5d9df'),
    resident('potter', 'Orla · Clay & Kiln', 28, 45, 'A pot dries before it sees the kiln, and cools before it sees a hand. The whole town is full of my first uneven bowls. Nobody will let me replace them.', 'Turning a bowl on the wheel', 0, '#e0bc9e'),
    resident('boatwright', 'Bram · Canal Boathouse', 40, 45, 'That narrow boat takes herbs to the kitchen without crushing them. It stays tied up while I replace the stern board. You can inspect the dock from the lane.', 'Planing a replacement board', 1, '#b9ccd4'),
    inspect('stable-notice', 'Pack Stable Dispatch Slate', 'book', 12, 44, 'Today’s loads: flour for the inn; empty jars to Hearthbloom; clean linen to the clinic. Dara has crossed out “spare wheel” and written “ask Kit”.'),
    inspect('pottery-shelf', 'Orla’s Drying Pots', 'pot', 24, 44, 'Each pot has a name scratched into its damp base: Miri, Fern, Esme, Mara. The pot marked “Mara” has a little lantern worked into its rim.'),
    inspect('canal-mooring', 'Canal Mooring Ledger', 'book', 46, 41, 'The kitchen boat is tied to the inner post; the broad landing is kept clear for mill sacks. A penciled reminder asks Bram to mend the stern before the next delivery.'),
    inspect('hearth-secret', 'A Small Door in the Wall', 'cache', 12, 25, 'Behind the weaver’s garden, a tiny painted door shelters a bowl of rainwater. The children insist this is where lost buttons return home. Someone has left a fresh blue button.'),
  );

  regions['crossing-inn'] = room('crossing-inn', 'Copper Kettle Inn', 'frontier', { x: 37, y: 10 }, 26, 20, 'wood', [
    furniture('counter', 3, 4, 8, 1), furniture('stove', 3, 2, 2, 2), furniture('shelf', 6, 2, 5, 1),
    furniture('wall', 17, 1, 1, 7), furniture('wall', 17, 11, 1, 7),
    furniture('wall', 18, 9, 3, 1), furniture('wall', 23, 9, 2, 1),
    furniture('bed', 20, 2, 2, 3), furniture('bed', 20, 12, 2, 3),
    furniture('table', 4, 9, 3, 2), furniture('table', 10, 12, 3, 2), furniture('table', 4, 14, 3, 2),
  ], [prop('rug', 9, 7, 6, 3), prop('chair', 3, 10), prop('chair', 7, 10), prop('chair', 9, 13), prop('chair', 13, 13), prop('pot', 23, 3), prop('clock', 13, 2), prop('book', 20, 7), prop('barrel', 2, 6)], [
    { ...resident('inn-cook', 'Ada · Innkeeper', 8, 6, 'A room, a bowl and a place to rest are always here. The clinic can patch up a team as well; nobody should have to walk a difficult road exhausted.', 'Setting bowls for supper', 2, '#e9c1a7'), task: task('breadDelivered', ['breadCollected'], 'That is the reserved flour. Ada kneads it into the watch loaves while you set the table. The night watch has its supper. Take two Field Tonics for your own road.', 'Riverside Kitchen keeps the supper order. Read it, then collect the reserved flour inside Toma’s mill before helping me bake.', 'The watch loaves are cooling beside the stove. There is a place set for you whenever you return.', { potion: 2 }) },
    { ...inspect('inn-rest', 'Guest Bed', 'book', 22, 13, 'The guest room has clean linen and a jug of water. Your companions settle beside the bed.'), service: 'heal' },
    resident('inn-traveler', 'Edda · Traveling Mapmaker', 5, 12, 'I used to draw roads as lines between towns. Now I leave room for kitchens and washing yards. That is where people tell you what a place is really called.', 'Annotating a folded route map', 1, '#bbc9e0'),
    inspect('inn-register', 'Copper Kettle Guest Register', 'book', 12, 4, 'Recent guests: Sela — one night, left before dawn. Orrin — two nights, forgot a scarf. Mara — supper only. The last line has room for a new name.'),
  ]);
  regions['field-clinic'] = room('field-clinic', 'Field Clinic', 'frontier', { x: 48, y: 9 }, 22, 16, 'stone', [
    furniture('bed', 3, 3, 2, 3), furniture('bed', 3, 9, 2, 3), furniture('bed', 16, 3, 2, 3),
    furniture('counter', 9, 4, 4, 1), furniture('shelf', 9, 2, 5, 1), furniture('table', 16, 10, 3, 2),
  ], [prop('rug', 8, 8, 6, 3), prop('pot', 6, 2), prop('pot', 19, 2), prop('chair', 7, 10), prop('chair', 14, 10), prop('basket', 2, 13), prop('clock', 15, 2)], [
    { ...resident('clinic-nurse', 'Imani · Field Nurse', 11, 6, 'Put your bags down. I will check each companion, then you can carry on when you are ready.', 'Preparing clean bandages', 2, '#d0e6d7'), service: 'heal' },
    resident('clinic-helper', 'Sol · Clinic Helper', 17, 8, 'Esme brings clean sheets every morning; Fern sends herbs and Ada sends soup. Most of the clinic is the work of people outside it.', 'Labeling herb jars', 0, '#d9d4bc'),
    inspect('clinic-chart', 'Companion Care Notes', 'book', 14, 4, 'Rest restores both health and energy. Field Tonics restore health to a living companion; Signal Tea restores energy. The clinic charges no fee.'),
  ]);
  regions['provision-shop'] = room('provision-shop', 'Miri’s Provisions', 'frontier', { x: 57, y: 10 }, 22, 16, 'wood', [
    furniture('shelf', 2, 2, 7, 1), furniture('shelf', 13, 2, 7, 1),
    furniture('shelf', 3, 6, 2, 4), furniture('shelf', 17, 6, 2, 4), furniture('counter', 8, 5, 6, 1),
    furniture('barrel', 2, 12, 2, 2), furniture('barrel', 18, 12, 2, 2),
  ], [prop('rug', 8, 10, 6, 2), prop('basket', 6, 7), prop('basket', 15, 8), prop('crate', 6, 2), prop('pot', 19, 4), prop('clock', 10, 2)], [
    resident('provisioner', 'Miri · Provisioner', 11, 7, 'Lantern oil on the left, thread on the right, and no charging twice for the same thing. If you need travel supplies, Ada and Rusk know a few jobs that pay in tonics and tea.', 'Checking the delivery book', 2, '#e2c5b1'),
    inspect('shop-supply-book', 'Town Supply Book', 'book', 7, 5, 'Flour: Amber Mill. Cloth: Elin. Pots: Orla. Herbs: Fern. The crossing is a circle of names before it is a list of things.'),
    inspect('shop-travel-guide', 'Field Supplies Guide', 'book', 15, 11, 'No currency is used on this road. Help with the watch supper, mill repair or orchard recipe for supplies; the inn and clinic offer free recovery.'),
  ]);
  regions['weaver-home'] = room('weaver-home', 'Elin’s Weaver House', 'frontier', { x: 6, y: 29 }, 20, 16, 'wood', [
    furniture('loom', 3, 3, 4, 3), furniture('shelf', 10, 2, 5, 1), furniture('bed', 15, 3, 2, 3),
    furniture('table', 4, 10, 3, 2), furniture('stove', 2, 13, 2, 2), furniture('wall', 12, 3, 1, 4),
  ], [prop('rug', 9, 8, 6, 3), prop('basket', 2, 7), prop('basket', 7, 7), prop('clothesline', 3, 2, 5), prop('chair', 3, 11), prop('chair', 7, 11), prop('pot', 17, 11)], [
    resident('weaver', 'Elin · Weaver', 6, 7, 'This blue cloth becomes clinic curtains. The yellow one is a lantern shade for Mara. I know where every length is going before I thread the loom.', 'Passing the shuttle through blue thread', 2, '#c0d3ed'),
    resident('weaver-child', 'Pip', 11, 10, 'I put the tiny door behind our house. A button disappeared, then came back blue. That is a very good trade.', 'Sorting buttons by size', 0, '#e2c49c'),
    inspect('weaver-patterns', 'Elin’s Pattern Book', 'book', 14, 8, 'River waves, orchard leaves and a lantern with six rays. Threads connect the page to the clothesline outside; the cloth is a map you can wear.'),
  ]);
  regions['keeper-home'] = room('keeper-home', 'Keeper’s Cottage', 'frontier', { x: 17, y: 29 }, 22, 16, 'wood', [
    furniture('bed', 3, 3, 2, 3), furniture('shelf', 9, 2, 7, 1), furniture('table', 9, 7, 4, 2),
    furniture('stove', 17, 3, 2, 2), furniture('counter', 16, 10, 4, 1), furniture('wall', 7, 2, 1, 5),
  ], [prop('rug', 8, 10, 6, 2), prop('chair', 8, 8), prop('chair', 13, 8), prop('pot', 19, 6), prop('clock', 13, 2), prop('basket', 3, 10)], [
    resident('keeper-relative', 'Lio · Mara’s Brother', 15, 7, 'Mara still comes home. Usually after the last traveler has crossed, when I have reheated her supper twice. She says a keeper’s job ends at the door; I do not think she believes it.', 'Keeping a small pot warm', 1, '#d9c4a5'),
    inspect('keeper-wall-map', 'Mara’s Kitchen Map', 'book', 10, 4, 'Pins mark the mill, orchard, observatory and every home on Hearth Row. A handwritten note below the lantern reads: “A place is safe when its people can get home.”'),
    inspect('keeper-chair', 'Mara’s Mended Chair', 'chair', 5, 9, 'One arm has been mended with blue thread. The cushion is worn into the shape of a small owl. A half-finished letter waits on the seat.'),
  ]);
  regions['gardener-home'] = room('gardener-home', 'Fern’s Glassleaf House', 'frontier', { x: 26, y: 29 }, 22, 18, 'wood', [
    furniture('planter', 3, 2, 3, 2), furniture('planter', 3, 6, 3, 2), furniture('planter', 3, 10, 3, 2),
    furniture('wall', 8, 1, 1, 6), furniture('wall', 8, 10, 1, 5),
    furniture('bed', 17, 2, 2, 3), furniture('stove', 11, 2, 2, 2), furniture('table', 12, 8, 4, 2),
    furniture('shelf', 11, 13, 7, 1),
  ], [prop('rug', 10, 10, 7, 2), prop('pot', 6, 4), prop('pot', 6, 9), prop('basket', 2, 13), prop('chair', 11, 9), prop('chair', 16, 9), prop('book', 14, 3)], [
    { ...inspect('recipe-request', 'Fern’s Empty Recipe Sleeve', 'book', 10, 6, 'An empty paper sleeve is pinned beside a pot of apple skins.'), task: task('recipeRequested', [], 'Fern has misplaced her mother’s apple-tea recipe. The last copy traveled with a basket to the blue cottage in Hearthbloom Orchard. She asks you to check the cottage porch basket.', '', 'The blue cottage’s porch basket in Hearthbloom Orchard may still hold the recipe.') },
    { ...resident('gardener-resident', 'Fern · Grower & Herbalist', 16, 11, 'The greenhouse keeps the clinic’s herbs alive through the cold months. The kitchen garden gets the best sun, but I keep the plants that need a little more patience here.', 'Pricking out young seedlings', 2, '#bfd7aa'), task: task('recipeReturned', ['recipeFound'], 'That is Mother’s handwriting. Fern reads the recipe twice, then brews a pot with the dried apple peel. Take two Signal Teas; the recipe is safely back in its sleeve.', 'There is an empty recipe sleeve beside my kitchen. Read the note and check the blue cottage’s porch basket in Hearthbloom Orchard.', 'The recipe is back above the stove. Every pot of apple tea tastes a little more like home now.', { ether: 2 }) },
    inspect('greenhouse-labels', 'The Seedling Labels', 'book', 6, 12, 'Nettle for cloth, mint for tea, marigold for the beans. Each label names a person as well as a plant: Elin, Imani, Aven.'),
  ]);
  regions['lantern-workshop'] = room('lantern-workshop', 'Rusk’s Lantern Workshop', 'frontier', { x: 39, y: 30 }, 24, 18, 'stone', [
    furniture('stove', 3, 2, 3, 3), furniture('anvil', 5, 7, 2, 2), furniture('workbench', 13, 3, 7, 2),
    furniture('shelf', 13, 1, 7, 1), furniture('table', 13, 10, 5, 2),
    furniture('barrel', 3, 12, 2, 2), furniture('barrel', 20, 12, 2, 2),
  ], [prop('logs', 2, 5, 3), prop('crate', 20, 3), prop('crate', 20, 5), prop('rug', 9, 12, 4, 2), prop('chair', 12, 11), prop('clock', 9, 2), prop('pot', 21, 9)], [
    { ...resident('workshop-smith', 'Rusk · Lampwright', 15, 6, 'A lantern is a little roof for a flame. A bearing is a little road for a wheel. Most good tools are simple once somebody has made them carefully.', 'Filing a bronze bearing', 1, '#d6baa0'), task: task('bearingReady', ['wheelRequested'], 'Toma’s maintenance note has the right measurement. Rusk fits the bronze bearing to the gauge and wraps it for the road. Take it to the inspection hatch inside Amber Watermill.', 'Toma keeps a maintenance ledger inside Amber Watermill. Read the fault description before I send you out with a part that does not fit.', 'The fitted bearing belongs at the inspection hatch inside Amber Watermill.') },
    inspect('workshop-patterns', 'Lantern Frame Patterns', 'book', 12, 4, 'Town lantern: broad hood. Ridge beacon: wind guard. Orchard lamp: low hanging hook. Each light keeps the shape of the weather around it.'),
    inspect('workshop-apprentice-bench', 'Kit’s Practice Bench', 'book', 18, 12, 'Six brass rings lie in a row. The first is crooked; the last is almost round. A note from Rusk says, “Keep them all. You should be able to see what you learned.”'),
  ]);
  regions['riverside-kitchen'] = room('riverside-kitchen', 'Riverside Kitchen', 'frontier', { x: 57, y: 30 }, 24, 18, 'stone', [
    furniture('stove', 3, 2, 3, 3), furniture('counter', 9, 3, 11, 1), furniture('shelf', 10, 1, 10, 1),
    furniture('table', 4, 9, 4, 2), furniture('table', 14, 9, 5, 2),
    furniture('barrel', 3, 13, 2, 2), furniture('planter', 19, 13, 3, 1),
  ], [prop('basket', 7, 3), prop('basket', 20, 5), prop('pot', 21, 2), prop('chair', 3, 10), prop('chair', 8, 10), prop('chair', 13, 10), prop('chair', 19, 10), prop('rug', 9, 13, 6, 2)], [
    { ...inspect('supper-order', 'The Night Watch Supper Order', 'book', 10, 5, 'A supper order waits beneath a clean wooden spoon.'), task: task('breadRequested', [], 'Tonight’s watch needs fresh bread. Toma has reserved flour inside Amber Watermill; bring the marked sack to Ada at the Copper Kettle Inn and help her finish the loaves.', '', 'Collect the marked flour sack inside Amber Watermill, then bring it to Ada at the Copper Kettle Inn.') },
    resident('kitchen-cook', 'Nessa · Community Cook', 6, 6, 'Soup leaves this kitchen for the clinic, the stable and anybody who needs it. Ada bakes the bread at the inn. The river does half the carrying, and neighbors do the rest.', 'Stirring a pot of garden soup', 2, '#e4c5a6'),
    resident('kitchen-helper', 'Ren · Kitchen Helper', 18, 7, 'The basket on the left came by boat, the one on the right by handcart. You can tell because Bram always ties his string into a sailor’s knot.', 'Chopping herbs for the evening pot', 0, '#c6d6b0'),
    inspect('kitchen-menu', 'Today’s Kitchen Slate', 'book', 20, 12, 'Bean soup, roasted roots, apple peel tea. A small second column records who cannot eat what. Nobody is a stranger to the kitchen for very long.'),
  ]);

  // Passable doors preserve every pre-expansion save position in the outer regions.
  regions.riverlands.objects.push({ id: 'amber-mill-door', type: 'exit', appearance: 'door', passable: true, x: 38, y: 29, name: 'Enter Amber Watermill', to: 'amber-mill', entry: { x: 12, y: 15 } });
  regions.highlands.objects.push({ id: 'starfall-study-door', type: 'exit', appearance: 'door', passable: true, x: 26, y: 9, name: 'Enter Starfall Observatory', to: 'starfall-study', entry: { x: 11, y: 15 } });
  regions['amber-mill'] = room('amber-mill', 'Amber Watermill · Milling Floor', 'riverlands', { x: 38, y: 30 }, 24, 18, 'wood', [
    furniture('workbench', 3, 3, 5, 4), furniture('counter', 13, 3, 7, 1), furniture('shelf', 15, 1, 6, 1),
    furniture('barrel', 3, 11, 2, 2), furniture('barrel', 6, 11, 2, 2), furniture('table', 16, 10, 4, 2),
  ], [prop('crate', 2, 8), prop('crate', 3, 9), prop('basket', 9, 11), prop('logs', 2, 14, 4), prop('chair', 20, 11), prop('rug', 10, 12, 4, 2), prop('clock', 10, 2)], [
    { ...inspect('reserved-flour', 'Reserved Flour Sack', 'basket', 14, 5, 'A flour sack has a copper-kettle stamp tied to its neck.'), task: task('breadCollected', ['breadRequested'], 'The marked flour is ready for the night watch supper. You secure the sack in your pack. Ada at the Copper Kettle Inn can turn it into the promised bread.', 'This flour is reserved. Read the night watch supper order inside Riverside Kitchen before collecting it.', 'The reserved flour is ready for Ada at the Copper Kettle Inn.') },
    { ...inspect('mill-maintenance', 'Toma’s Maintenance Ledger', 'book', 19, 7, 'A measured sketch sits beside a worn bronze ring.'), task: task('wheelRequested', [], 'The wheel’s lower bearing is worn, leaving the canal ferry winch without power. Toma has written its measurement and asks for a replacement from Rusk in Lantern Workshop, on the east side of Frontier Crossing.', '', 'Rusk at Lantern Workshop can fit a replacement bearing. Bring it back to the inspection hatch beside the milling machinery.') },
    { ...inspect('mill-inspection-hatch', 'Waterwheel Inspection Hatch', 'book', 8, 5, 'A handwheel locks the machinery safely before the inspection hatch opens.'), task: task('wheelRepaired', ['bearingReady'], 'You lock the wheel, seat Rusk’s bearing and close the hatch before releasing the brake. The wheel turns evenly again. The canal ferry is running: its dock west of the mill connects directly to the town dock beside the boathouse. Toma has left two Field Tonics and a Signal Tea with the completed job.', 'Read the maintenance ledger and collect the correctly fitted bearing from Rusk before opening the inspection hatch.', 'The bearing runs smoothly. The canal ferry connects the mill dock to Frontier Crossing’s boathouse dock.', { potion: 2, ether: 1 }) },
    resident('mill-apprentice', 'Anji · Miller’s Apprentice', 12, 8, 'Toma checks the river while I measure the grain. Flour for the inn, bran for the gardens, and a swept floor before I go home. Nothing here is wasted if we pay attention.', 'Measuring grain into a hopper', 0, '#d4c7ae'),
  ]);
  regions['starfall-study'] = room('starfall-study', 'Starfall Observatory · Reading Room', 'highlands', { x: 26, y: 10 }, 22, 18, 'stone', [
    furniture('shelf', 2, 2, 6, 1), furniture('shelf', 14, 2, 6, 1), furniture('shelf', 2, 5, 1, 7),
    furniture('table', 8, 6, 5, 3), furniture('bed', 17, 11, 2, 3), furniture('stove', 3, 13, 2, 2),
  ], [prop('rug', 7, 10, 7, 3), prop('telescope', 11, 3), prop('chair', 7, 7), prop('chair', 13, 7), prop('pot', 19, 5), prop('book', 16, 8), prop('clock', 5, 3)], [
    resident('observatory-assistant', 'Veya · Chart Keeper', 14, 10, 'Orrin watches the sky; I copy what he sees so it survives a cloudy night. The shelves keep a century of little observations, not one grand answer.', 'Comparing two hand-drawn star charts', 2, '#c7c5df'),
    inspect('observatory-log', 'The Long Weather Record', 'book', 6, 5, 'Rain delayed the mill grain; a frost changed the orchard harvest; clear skies brought three travelers over Sunward. The stars fill the top of each page, and everyday life fills the rest.'),
    inspect('observatory-letter', 'An Unsent Letter to Mara', 'book', 16, 7, '“Your lantern is too small to appear in our charts, but I know where to look for it. I suspect that is the point of keeping a light.” The letter is signed Orrin.'),
    { ...inspect('observatory-rest', 'The Spare Cot', 'book', 19, 12, 'A spare cot and a thick quilt wait for anyone caught on the ridge after dark.'), service: 'heal' },
  ]);
  regions.orchard.objects.push({ ...inspect('orchard-recipe-basket', 'Blue Cottage Porch Basket', 'basket', 16, 9, 'A folded kitchen note lies beneath a clean basket liner.'), passable: true, task: task('recipeFound', ['recipeRequested'], 'Under the liner is a recipe for apple peel tea, written in Fern’s mother’s hand. You fold it carefully for the return to Glassleaf House on Hearth Row.', 'The note belongs to a family in the crossing. Fern at Glassleaf House can tell you why this old recipe matters.', 'The recipe is safely packed for Fern at Glassleaf House.') });
  for (const [index, name, art, tint] of [[0, 'Blue Cottage · Bela’s Family', 'townhouse', '#c0d5ec'], [1, 'Upper Cottage · Orchard Store', 'barn', '#e1c697'], [2, 'Hearthbloom Growers’ House', 'greenhouse', '#d2ddaf']]) Object.assign(regions.orchard.solid[index], { name, art, tint });
  regions.riverlands.solid.find(rect => rect.kind === 'mill').name = 'Amber Watermill · Toma & Anji';
  regions.highlands.solid.find(rect => rect.kind === 'observatory').name = 'Starfall Observatory · Orrin & Veya';
  const physicalKinds = new Set(['bench', 'cart', 'crate', 'pot', 'barrel', 'basket', 'mailbox', 'clothesline', 'planter', 'anvil', 'logs', 'hay', 'boat', 'fence']);
  const physicalProps = town.decorations.filter(detail => (detail.x >= 28 || detail.y >= 18) && physicalKinds.has(detail.kind));
  town.solid.push(...physicalProps.map(({ kind, ...detail }) => ({ ...detail, kind: 'furniture', art: kind })));
  town.decorations = town.decorations.filter(detail => !physicalProps.includes(detail));
}
