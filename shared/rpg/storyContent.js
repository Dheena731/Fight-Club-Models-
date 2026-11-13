const stage = (flag, regionId, objectId, objective, kind, text, extra = {}) => ({ id: flag, flag, regionId, objectId, objective, kind, text, ...extra });
export const STORY_CHAPTERS = [
 { id:'river', name:'The River Remembers', description:'A reversed mill wheel reveals an old promise between the orchard and the river.', requiresFlag:'questComplete', flag:'riverComplete', steps:[
 stage('riverIntro','frontier','guide','Ask Mara about the river.','talk','The river bell rang against the current last night, though no storm reached the crossing. Toma is checking the wheel. Please listen to him; he has kept that mill running for everyone.'),
 stage('riverWheel','riverlands','miller','Inspect the wheel with Toma.','talk','The wheel turned backward before dawn, and the flour room flooded. Anji found an old warning in the mill ledger. Bela remembers what happened on the orchard side.'),
 stage('riverWarning','amber-mill','mill-apprentice','Ask Anji about the old warning.','talk','A flood warning was left out of the ledger. Someone feared the mill would be blamed, so the next keeper never saw it. The high-water mark upstream is older than either of us.'),
 stage('riverMark','riverlands','river-mark','Inspect the old flood mark.','talk','A line above the bank records the flood. The bell once warned both banks before the gates moved.'),
 stage('riverTestimony','orchard','orchard-keeper','Hear Bela’s account.','talk','We lost a spring harvest, but the mill sheltered our families that night. I do not want blame to drown out what happened. The roots in Moss Circuit still hum when the river rises.'),
 stage('riverRoots','grove','grove-inscription','Listen to the roots in Moss Circuit.','talk','The roots carry two pulses: first release the high water, then share the flow. A bell can tell both banks when the gates are moving.'),
 stage('riverDecision','riverlands','miller','Decide how Toma should acknowledge the warning.','choice','I should have checked the old ledger. How should I make this right?', { choices:[{id:'public',label:'Add the warning to the public ledger',flag:'riverPublic',text:'Everyone can read it, and everyone can add what they remember.'},{id:'private',label:'Tell Bela and the mill families personally',flag:'riverPrivate',text:'I will speak to each family. Their trust deserves time.'}] }),
 stage('riverRouted','riverlands','river-route','Route the water at the listening post.','puzzle','The gates answer the roots.',{puzzle:'river'}),
 stage('echoDefeated','riverlands','echo-guardian','Meet the Echo Guardian beside the mill.','battle','The river’s echo rises.'),
 stage('riverComplete','frontier','guide','Return to Mara with the river’s story.','finale','Mara rings the bell. Toma and Bela promise to warn each other before the gates move again.') ] },
 { id:'stars', name:'The Night of Returning Stars', description:'A forgotten request reaches the valley, and its people answer together.', requiresFlag:'riverComplete', flag:'starsComplete', steps:[
 stage('starsIntro','starfall-study','observatory-assistant','Speak to Veya in the observatory study.','talk','An old distress signal has returned between the stars, repeating a pattern I copied years ago. I thought it was only a gap in my chart. Orrin keeps the weather records from that night.'),
 stage('starsWeather','highlands','star-keeper','Ask Orrin about the weather log.','talk','Clouds covered the ridge the night the signal came. My weather log says Sunward sent it, but I never recorded an answer. Sela kept the first beacon; ask what she remembers.'),
 stage('starsRequest','sunward','routekeeper','Ask Sela about the old request.','talk','I asked for help when the ridge road fell. No one answered where I could see it. The Archive kept the record.'),
 stage('starsRecord','archive','scholar','Ask Neri for the Archive record.','talk','The crossing sent food and hands when the road fell, but no named reply reached Sela’s beacon. People thought the work itself was answer enough. The memory desk holds the old instructions.'),
 stage('starsClue','archive','memory-desk','Read the beacon instructions.','talk','The record asks: what reaches a distant keeper? First a clear signal, then a named reply, then a path home.'),
 stage('starsReply','starfall-study','observatory-assistant','Choose Veya’s reply.','choice','Should the answer carry the town’s name or Sela’s?',{choices:[{id:'town',label:'Send the town’s promise',flag:'starsTown',text:'Every household will have a place in the reply.'},{id:'sela',label:'Name Sela in the reply',flag:'starsSela',text:'She will know that someone heard her.'}]}),
 stage('starsAligned','sunward','sky-beacon','Align the Sunward beacon.','puzzle','The beacon waits for your answer.',{puzzle:'stars'}),
 stage('keeperDefeated','archive','constellation-keeper','Meet the Constellation Keeper in the Archive.','battle','The Keeper wakes to carry the answer.'),
 stage('starsBeacon','highlands','star-keeper','Tell Orrin the answer is ready.','talk','There! The missing star is visible again. Veya can send the reply, and Sela will see it from the road.'),
 stage('starsComplete','frontier','guide','Bring the returning stars home to Mara.','finale','Mara sets another place by the lantern. Across the valley, the beacons answer one another.') ] }
];
export const STORY_SIDE_QUESTS = [
 {id:'map',name:'A Map with Room',description:'Help Edda map places people remember.',flag:'mapComplete',steps:[stage('mapStart','crossing-inn','inn-traveler','Ask Edda about her map.','talk','Maps need memories as well as roads. Sketch the river bell, orchard tree and highland tripod in any order.'),stage('mapRiver','riverlands','river-mark','Sketch the river bell.','evidence','The bell marks a gathering place.'),stage('mapOrchard','orchard','ribbon-tree','Sketch the orchard tree.','evidence','Ribbons mark the orchard meeting place.'),stage('mapHighlands','highlands','survey-tripod','Sketch the highland lookout.','evidence','The tripod marks the view home.'),stage('mapComplete','crossing-inn','inn-traveler','Bring the sketches to Edda.','talk','Now the map shows where people belong, too. Thank you. Take a field tonic for the next road; your team also gains 10 XP.')]},
 {id:'ribbons',name:'A Ribbon for Home',description:'Carry Pip’s ribbons to the orchard and back.',flag:'ribbonsComplete',steps:[stage('ribbonsStart','weaver-home','weaver-child','Ask Pip about the ribbons.','talk','I made ribbons for the orchard tree. Will you tie them where Bela can see?'),stage('ribbonsTied','orchard','ribbon-tree','Tie Pip’s ribbons to the tree.','talk','The ribbons turn in the orchard breeze.'),stage('ribbonsComplete','weaver-home','weaver-child','Tell Pip about the ribbons.','talk','I can see them from the lane! I will make one for Bela, too. Please take a field tonic; your team also gains 10 XP.')]},
 {id:'letter',name:'A Letter in the Sky',description:'Help Veya send a small message home.',flag:'letterComplete',steps:[stage('letterStart','starfall-study','observatory-assistant','Ask Veya about her letter.','talk','I keep putting off a letter to Mara. Please leave it at the Sunward mail satchel.'),stage('letterSent','sunward','mail-satchel','Leave Veya’s letter in the satchel.','talk','The letter joins the next delivery to town.'),stage('letterComplete','starfall-study','observatory-assistant','Tell Veya her letter is on its way.','talk','Thank you. I will visit Mara myself when the charts are finished. Take a field tonic for the road; your team also gains 10 XP.')]} ];
export const STORY_FLAG_IDS = [...STORY_CHAPTERS.flatMap(q=>q.steps.map(s=>s.flag)), ...STORY_SIDE_QUESTS.flatMap(q=>q.steps.map(s=>s.flag)), 'riverPublic','riverPrivate','starsTown','starsSela'];
export const STORY_PUZZLES = {
 river:{id:'river',title:'River Routing',clue:'The roots say: release high water before sharing the flow.',choices:[{id:'release',name:'Release high water'},{id:'share',name:'Share the flow'},{id:'close',name:'Close both gates'}],sequence:['release','share'],flag:'riverRouted',requires:['riverDecision'],text:'The gates open in order. The river settles, and an echo rises.'},
 stars:{id:'stars',title:'Beacon Reply',clue:'Choose what makes a distant reply possible at each step.',prompts:['What can cross the distance?','What shows who was heard?','What guides a keeper home?'],choices:[{id:'signal',name:'A clear signal'},{id:'name',name:'A named reply'},{id:'path',name:'A path home'}],sequence:['signal','name','path'],flag:'starsAligned',requires:['starsReply'],text:'The beacon sends a clear, named path home.'}
};
export function expandStoryWorld(regions) {
 const descriptions = {
  'river-mark': 'A bell and a high-water mark record where the river once reached.',
  'river-route': 'The listening post carries the sound of the gates to both banks.',
  'ribbon-tree': 'The orchard tree offers shade to anyone waiting on the road.',
  'pollen-press': 'Pressed blossoms preserve the orchard’s changing seasons.',
  'survey-tripod': 'A mapmaker can see the river and the road home from here.',
  'sky-beacon': 'The beacon faces the distant ridge, ready to carry a message.',
  'mail-satchel': 'Letters wait here for the next walker to carry them home.',
  'memory-desk': 'Careful hands have copied the valley’s memories into these pages.',
  'story-noticeboard': 'Weather notes and observations cover the observatory board.',
 };
 const add = (region, id, x, y, name, appearance, extra = {}) => regions[region].objects.push({
  id, x, y, name, appearance, type:'lore', passable:true, color:'#b7c695', text: descriptions[id], ...extra,
 });
 add('riverlands','river-mark',20,14,'River Bell','river-bell',{storyFlag:'riverMark'});
 add('riverlands','river-route',22,15,'River Listening Post','listening-post',{storyFlag:'riverRouted'});
 add('riverlands','echo-guardian',32,30,'Echo Guardian','river-bell',{type:'enemy',encounterId:'echo-guardian',requires:['riverRouted'],hiddenFlag:'echoDefeated',storyFlag:'echoDefeated'});
 add('orchard','ribbon-tree',29,24,'Ribbon Tree','ribbon-tree',{storyFlag:'ribbonsTied'});
 add('orchard','pollen-press',38,30,'Pollen Press','pollen-press',{storyFlag:'riverComplete'});
 add('highlands','survey-tripod',33,8,'Survey Tripod','survey-tripod',{storyFlag:'mapHighlands'});
 add('sunward','sky-beacon',26,7,'Sky Beacon','sky-beacon',{storyFlag:'starsAligned'});
 add('sunward','mail-satchel',28,18,'Mail Satchel','mail-satchel',{storyFlag:'letterSent'});
 add('archive','memory-desk',14,8,'Memory Desk','memory-desk',{storyFlag:'starsClue'});
 add('archive','constellation-keeper',13,6,'Constellation Keeper','listening-post',{type:'enemy',encounterId:'constellation-keeper',requires:['starsAligned'],hiddenFlag:'keeperDefeated',storyFlag:'keeperDefeated'});
 add('starfall-study','story-noticeboard',8,10,'Observatory Noticeboard','noticeboard',{storyFlag:'starsComplete'});
}
