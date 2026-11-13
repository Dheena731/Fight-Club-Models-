import { STORY_CHAPTERS, STORY_SIDE_QUESTS } from './storyContent.js';
const availableSteps = (quest, flags) => {
 if (quest.id === 'map' && flags.mapStart && !flags.mapComplete) {
  const evidence = quest.steps.slice(1,4).filter(step => !flags[step.flag]);
  return evidence.length ? evidence : [quest.steps[4]];
 }
 const next = quest.steps.find(step => !flags[step.flag]);
 return next ? [next] : [];
};
const progress = (state, quest) => {
 const locked = Boolean(quest.requiresFlag && !state.flags[quest.requiresFlag]);
 const leads = locked ? [] : availableSteps(quest,state.flags);
 return {...quest,locked,available:!locked,started:quest.steps.some(step=>state.flags[step.flag]),complete:Boolean(state.flags[quest.flag]),next:leads[0] || null,leads};
};
export const storyProgress = state => state.mode === 'journey' ? STORY_CHAPTERS.map(q=>progress(state,q)) : [];
export const sideStoryProgress = state => state.mode === 'journey' ? STORY_SIDE_QUESTS.map(q=>progress(state,q)) : [];
export const currentStory = state => storyProgress(state).find(q=>!q.locked && !q.complete) || null;
export const storyLead = state => currentStory(state)?.next || sideStoryProgress(state).find(q=>q.started&&!q.complete)?.next || null;
export const activeStoryStage = (state, object) => [...storyProgress(state),...sideStoryProgress(state)].flatMap(q=>q.leads).find(step=>step.regionId===state.locationId && step.objectId===object.id) || null;
export function validStoryFlags(flags) {
 for (const chapter of STORY_CHAPTERS) {
  if (chapter.steps.some((s,i)=>flags[s.flag] && (!flags[chapter.requiresFlag] || chapter.steps.slice(0,i).some(p=>!flags[p.flag])))) return false;
 }
 for (const quest of STORY_SIDE_QUESTS) {
  if (quest.id === 'map') {
   if (quest.steps.slice(1,4).some(s=>flags[s.flag]) && !flags.mapStart || flags.mapComplete && (!flags.mapStart || quest.steps.slice(1,4).some(s=>!flags[s.flag]))) return false;
  } else if (quest.steps.some((s,i)=>flags[s.flag] && quest.steps.slice(0,i).some(p=>!flags[p.flag]))) return false;
 }
 return Boolean(flags.riverDecision) === Boolean(flags.riverPublic !== flags.riverPrivate) && Boolean(flags.starsReply) === Boolean(flags.starsTown !== flags.starsSela) && !(flags.riverPublic && flags.riverPrivate) && !(flags.starsTown && flags.starsSela);
}
