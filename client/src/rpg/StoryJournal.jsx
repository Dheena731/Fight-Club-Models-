import { useState } from 'react';
import { ADVENTURE_REGIONS, QUESTS } from '../../../shared/rpg/adventureContent.js';
import { valleyProgress } from '../../../shared/rpg/adventure.js';
import { currentStory, sideStoryProgress, storyProgress } from '../../../shared/rpg/story.js';

function TrackLead({ lead, onTrack, children = 'Track next step' }) {
  return lead && <button className="journey-button is-primary" onClick={() => onTrack({ regionId: lead.regionId, objectId: lead.objectId })}>{children}</button>;
}

export default function StoryJournal({ state, onTrack }) {
  const lantern = valleyProgress(state).find(project => project.id === 'archive');
  const opening = { id: 'lantern-signal', name: 'The Lantern Signal', description: 'A dark lantern, a lost shard and a promise to bring your companion home. The valley’s first light is only the beginning.', steps: QUESTS, complete: state.flags.questComplete, available: true, next: lantern.complete ? null : { regionId: lantern.targetRegionId, objectId: lantern.objectId, objective: lantern.objective } };
  const chapters = [opening, ...storyProgress(state)];
  const active = state.flags.questComplete ? currentStory(state)?.id || chapters.at(-1).id : opening.id;
  const [selected, setSelected] = useState(active);
  const chapter = chapters.find(entry => entry.id === selected) || opening;
  const locked = chapter.locked || chapter.available === false;
  const nextIndex = chapter.steps.findIndex(step => !state.flags[step.flag]);
  const revealed = chapter.complete ? chapter.steps : chapter.steps.slice(0, nextIndex + 1);
  return <section className="journey-story-journal" aria-label="Story chapters">
    <label className="journey-chapter-picker">Story chapters<select value={chapter.id} onChange={event => setSelected(event.target.value)}>{chapters.map((entry, index) => <option key={entry.id} value={entry.id}>Chapter {index + 1} · {entry.name}{entry.complete ? ' · Complete' : entry.locked || entry.available === false ? ' · Locked' : ''}</option>)}</select></label>
    <h3>{chapter.name}</h3><p className="journey-story-description">{chapter.description}</p>
    {locked ? <p className="journey-story-next">Finish the preceding story chapter to discover this part of the journey. The valley’s roads and optional quests remain open.</p> : chapter.next ? <div className="journey-story-next"><p><strong>Your next lead</strong><br />{chapter.next.objective}</p><TrackLead lead={chapter.next} onTrack={onTrack} /></div> : <p className="journey-story-next">This chapter is complete. The people you helped remember your choices.</p>}
    {!locked && <ol className="journey-story-steps">{revealed.map((step, index) => <li key={step.id || step.flag} className={state.flags[step.flag] ? 'is-complete' : 'is-current'}><span>{state.flags[step.flag] ? 'Done' : 'Next'}</span><div><strong>{step.name || step.title || step.objective}</strong>{(step.name || step.title) && <p>{step.objective}</p>}{step.regionId && <small>{ADVENTURE_REGIONS[step.regionId].name}</small>}{state.flags[step.flag] && step.choices?.some(choice => state.flags[choice.flag]) && <p className="journey-story-decision">You chose: {step.choices.find(choice => state.flags[choice.flag]).label}</p>}</div><span className="journey-story-step-number" aria-hidden="true">{index + 1}</span></li>)}</ol>}
    <p className="journey-muted">Conversations can be left and revisited. Completed quests and decisions are saved with your Journey.</p>
  </section>;
}

export function PersonalQuests({ state, onTrack, townTasks, recordedSites }) {
  const quests = sideStoryProgress(state);
  return <section className="journey-personal-quests" aria-label="People of the valley"><h3>People worth coming back to</h3><p>Small promises travel with you. These stories can be followed alongside the main chapters.</p>
    <ol className="journey-personal-list">{quests.map(quest => <li key={quest.id}><h4>{quest.name}<span>{quest.complete ? 'Complete' : quest.started ? 'In progress' : 'A new acquaintance'}</span></h4><p>{quest.description}</p>{quest.complete ? <p className="journey-story-decision">Your help is remembered. Visit again to hear what changed.</p> : quest.locked || quest.available === false ? <p className="journey-muted">Continue the story to meet this request.</p> : <><p className="journey-personal-objective">{quest.next?.objective}</p>{(quest.leads?.length ? quest.leads : [quest.next]).filter(Boolean).map(lead => <TrackLead key={lead.objectId} lead={lead} onTrack={onTrack}>{quest.leads?.length > 1 ? `Track ${ADVENTURE_REGIONS[lead.regionId].name}` : 'Track this promise'}</TrackLead>)}</>}</li>)}</ol>
    <details className="journey-neighbor-records"><summary>Town errands & places remembered</summary><h3>Neighbors & errands</h3><ol className="journey-journal-quests">{townTasks.map(task => <li key={task.id} className={task.complete ? 'is-complete' : ''}><div><strong>{task.name}{task.complete ? ' · Complete' : task.started ? ' · In progress' : ''}</strong><p>{task.objective}</p></div></li>)}</ol><h3>Places remembered</h3>{recordedSites.length ? <ul className="journey-map-landmarks">{recordedSites.map(site => <li key={site.id}><strong>{site.name}</strong><span>{site.region}</span></li>)}</ul> : <p className="journey-muted">Inspect the valley’s landmarks to keep their stories here.</p>}</details>
  </section>;
}
