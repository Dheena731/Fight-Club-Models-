import { adventureRoute, mapLandmarks } from './adventureNavigation.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { ADVENTURE_REGIONS, STARTER_IDS } from './adventureContent.js';
import { STORY_CHAPTERS, STORY_SIDE_QUESTS, STORY_FLAG_IDS, STORY_PUZZLES } from './storyContent.js';
import { currentStory, sideStoryProgress, storyLead } from './story.js';
import { adventureReducer, createAdventure, createCompanion, isAdventureWalkable } from './adventure.js';
import { toAdventureSave, fromAdventureSave } from './adventureSave.js';
const act=(s,type,extra={})=>adventureReducer(s,{type,...extra});
function visit(s,stage) {
 const o=ADVENTURE_REGIONS[stage.regionId].objects.find(o=>o.id===stage.objectId); assert.ok(o,stage.objectId);
 s={...s,locationId:stage.regionId,discoveries:[...new Set([...s.discoveries,stage.regionId,...(ADVENTURE_REGIONS[stage.regionId].parentRegion ? [ADVENTURE_REGIONS[stage.regionId].parentRegion] : [])])],dialogue:null,result:null,puzzle:null};
 const points=[[0,1,'up'],[0,-1,'down'],[1,0,'left'],[-1,0,'right']];
 const pos=points.find(([dx,dy])=>isAdventureWalkable(s,o.x+dx,o.y+dy)); assert.ok(pos,stage.objectId);
 return {...s,x:o.x+pos[0],y:o.y+pos[1],facing:pos[2]};
}
function base(starter='emberquill') {
 const s=createAdventure({starterId:starter});
 Object.assign(s.flags,{questStarted:true,shardFound:true,wispDefeated:true,noteRead:true,relayRestored:true,bossDefeated:true,questComplete:true});
 Object.assign(s.inventory,{'signal-shard':1,'clear-circuit':1,'lantern-emblem':1});
 s.team=[createCompanion(starter,90)]; return s;
}
function runStage(s,stage,choiceIndex=0) {
 s=visit(s,stage); s=act(s,'INTERACT');
 if(stage.kind==='choice') {
  assert.ok(s.dialogue?.choices); const bad=act(s,'DIALOGUE_CHOICE',{choiceId:'invalid'}); assert.strictEqual(bad,s);
  s=act(s,'DIALOGUE_CHOICE',{choiceId:stage.choices[choiceIndex].id});
 } else if(stage.kind==='puzzle') {
  assert.ok(s.puzzle); const puzzle=STORY_PUZZLES[stage.puzzle];
  s=act(s,'STORY_CHOICE',{choice:puzzle.sequence.at(-1)}); assert.equal(s.puzzle.step,0);
  for(const choice of puzzle.sequence) s=act(s,'STORY_CHOICE',{choice});
 } else if(stage.kind==='battle') {
  assert.ok(s.battle); const saved=fromAdventureSave(toAdventureSave(s)); assert.ok(saved,'battle reload'); s=saved;
  for(let i=0;s.battle&&i<40;i++) s=act(s,'BATTLE_MOVE',{moveId:s.battle.enemy.intent.damage>=10?'ward':'strike'});
  assert.equal(s.result?.outcome,'won');
 }
 assert.equal(s.flags[stage.flag],true,stage.flag);
 let saved; try { saved=fromAdventureSave(toAdventureSave(s)); } catch(e) { throw new Error(stage.flag+': '+e.message); } assert.ok(saved,'stage reload '+stage.flag);
 return saved;
}
for(const starter of STARTER_IDS) test('complete both chapters with '+starter,()=>{
 let s=base(starter);
 for(const chapter of STORY_CHAPTERS) for(const stage of chapter.steps) s=runStage(s,stage,starter==='duplet'?1:0);
 assert.equal(currentStory(s),null); assert.equal(s.flags.riverComplete,true); assert.equal(s.flags.starsComplete,true);
 const xp=s.team[0].xp; s=visit(s,STORY_CHAPTERS[1].steps.at(-1)); s=act(s,'INTERACT'); assert.equal(s.team[0].xp,xp);
});
test('unordered evidence, independent quests and strict migration',()=>{
 let s=base(); const map=STORY_SIDE_QUESTS[0]; s=runStage(s,map.steps[0]);
 for(const stage of [map.steps[3],map.steps[1],map.steps[2],map.steps[4]]) s=runStage(s,stage);
 for(const q of STORY_SIDE_QUESTS.slice(1)) for(const stage of q.steps) s=runStage(s,stage);
 assert.ok(sideStoryProgress(s).every(q=>q.complete));
 const snapshot=toAdventureSave(base()); for(const id of STORY_FLAG_IDS) delete snapshot.flags[id];
 assert.ok(fromAdventureSave(snapshot)); snapshot.flags.riverIntro=false; assert.equal(fromAdventureSave(snapshot),null);
});
test('choices are transient and invalid branch combinations fail closed',()=>{
 let s=base(); for(const stage of STORY_CHAPTERS[0].steps.slice(0,6)) s=runStage(s,stage);
 s=visit(s,STORY_CHAPTERS[0].steps[6]); s=act(s,'INTERACT'); const saved=fromAdventureSave(toAdventureSave(s)); assert.equal(saved.dialogue,null); assert.equal(saved.flags.riverDecision,false);
 const invalid=toAdventureSave(saved); invalid.flags.riverPublic=true; assert.equal(fromAdventureSave(invalid),null);
 s=act(s,'DIALOGUE_CHOICE',{choiceId:'public'}); const broken=toAdventureSave(s); broken.flags.riverPrivate=true; assert.equal(fromAdventureSave(broken),null);
});

test('resident topics are canonical and side quest rewards cannot be farmed',()=>{
 let s=base(); const quest=STORY_SIDE_QUESTS[1]; for(const stage of quest.steps) s=runStage(s,stage);
 const xp=s.team[0].xp, potions=s.inventory.potion; s=visit(s,quest.steps.at(-1)); s=act(s,'INTERACT');
 assert.ok(s.dialogue?.choices); assert.strictEqual(act(s,'DIALOGUE_CHOICE',{choiceId:'fake'}),s);
 s=act(s,'DIALOGUE_CHOICE',{choiceId:'ribbons'}); assert.match(s.dialogue.text,/ribbons/i);
 s=act(s,'DISMISS_DIALOGUE'); s=act(s,'INTERACT'); s=act(s,'DIALOGUE_CHOICE',{choiceId:'ribbons'});
 assert.equal(s.team[0].xp,xp); assert.equal(s.inventory.potion,potions);
});

test('retreat preserves the encounter and puzzle actions stay isolated',()=>{
 let s=base(); for(const stage of STORY_CHAPTERS[0].steps.slice(0,7)) s=runStage(s,stage);
 const puzzleStage=STORY_CHAPTERS[0].steps[7]; s=visit(s,puzzleStage); s=act(s,'INTERACT');
 assert.strictEqual(act(s,'PUZZLE_CHOICE',{lamp:'amber'}),s); assert.strictEqual(act(s,'VALLEY_CHOICE',{choice:'release'}),s);
 s=act(s,'CANCEL_PUZZLE'); assert.equal(s.flags.riverRouted,false);
 s=runStage(s,puzzleStage); s=visit(s,STORY_CHAPTERS[0].steps[8]); s=act(s,'INTERACT'); s=act(s,'RETREAT');
 assert.equal(s.flags.echoDefeated,false); s=fromAdventureSave(toAdventureSave(s)); assert.equal(s.result.outcome,'retreated');
 s=act(s,'CONTINUE_RESULT'); s=visit(s,STORY_CHAPTERS[0].steps[8]); s=act(s,'INTERACT'); assert.equal(s.battle.encounterId,'echo-guardian');
});

test('every current chapter and personal lead is publicly trackable',()=>{
 let s=base();
 for(const chapter of STORY_CHAPTERS) for(const stage of chapter.steps) {
  const lead=storyLead(s); assert.equal(lead.flag,stage.flag);
  assert.ok(mapLandmarks(s,lead.regionId).some(object=>object.id===lead.objectId),stage.flag);
  const route=adventureRoute(s,lead); assert.ok(route && !route.blocked,stage.flag);
  s=runStage(s,stage);
 }
 const fresh=createAdventure();
 for(const quest of sideStoryProgress(fresh)) for(const lead of quest.leads) {
  assert.ok(mapLandmarks(fresh,lead.regionId).some(object=>object.id===lead.objectId));
  assert.ok(adventureRoute(fresh,lead));
 }
});
