import { ADVENTURE_REGIONS } from '../../../shared/rpg/adventureContent.js';
import { valleyProgress } from '../../../shared/rpg/adventure.js';

export function ValleySeal({ regionId, complete }) {
  return <svg className={`journey-valley-seal is-${regionId} ${complete ? 'is-complete' : ''}`} viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <path d="M10 3h20v4h7v26h-7v4H10v-4H3V7h7z" fill="currentColor" fillOpacity={complete ? '1' : '.1'} stroke="currentColor" strokeWidth="2" />
    <g stroke={complete ? '#f6f1dc' : 'currentColor'} strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      {regionId === 'grove' ? <><path d="M20 29V16m0 7c-9 0-10-6-10-11 8 0 10 4 10 11Zm0-3c0-8 4-10 10-10 0 7-3 10-10 10Z" /></>
        : regionId === 'sunward' ? <><circle cx="20" cy="20" r="6" /><path d="M20 8v3m0 18v3M8 20h3m18 0h3M11 11l3 3m12 12 3 3m-18 0 3-3m12-12 3-3" /></>
          : regionId === 'riverlands' ? <><path d="M9 15c5-5 8 5 13 0s7 0 9 0M9 23c5-5 8 5 13 0s7 0 9 0M13 10v19m14-19v19" /></>
            : regionId === 'orchard' ? <><path d="M20 16c-10-8-15 6-8 12 4 4 6 1 8 1s4 3 8-1c7-6 2-20-8-12Zm0 0V9m0 5c2-5 6-5 9-4-2 4-5 5-9 4Z" /></>
              : regionId === 'highlands' ? <><path d="m20 8 3 8 9 1-7 6 2 9-7-5-7 5 2-9-7-6 9-1Z" /></>
                : <><path d="M10 11h8l2 3 2-3h8v18h-8l-2 2-2-2h-8Zm10 3v17m-7-14h3m8 0h3m-14 5h3m8 0h3" /></>}
    </g>
  </svg>;
}

export default function ValleyAlmanac({ state, onTrack }) {
  const projects = valleyProgress(state);
  const complete = projects.filter(project => project.complete).length;
  return <section className="journey-almanac" aria-label="Valley Almanac">
    <div className="journey-almanac-intro"><div><h3>Six places. One living valley.</h3><p>Trace the moss, follow the sunlight, bring the river and gardens back to life. Each restored place leaves its mark here.</p></div><span className="journey-almanac-count" aria-label={`${complete} of 6 valley stamps collected`}>{complete}<small>/ 6 stamps</small></span></div>
    <ol className="journey-almanac-stamps" aria-label="Valley stamps">{projects.map(project => <li key={project.id}><button className="journey-stamp-target" aria-label={`${project.complete ? 'Revisit' : 'Track'} ${ADVENTURE_REGIONS[project.regionId].name} fieldwork`} onClick={() => onTrack(project.complete ? { regionId: project.regionId } : { regionId: project.targetRegionId || project.regionId, objectId: project.objectId })}><ValleySeal regionId={project.regionId} complete={project.complete} /><span>{ADVENTURE_REGIONS[project.regionId].name}</span><small>{project.complete ? 'Restored · revisit' : 'Track fieldwork'}</small></button></li>)}</ol>
    <p className="journey-almanac-homecoming">{state.flags.valleyComplete ? 'The valley lantern is lit. Your Valley Keeper rewards are waiting in the Locker.' : complete === 6 ? 'Every light is home. Return to the festival lantern in Frontier Crossing for the valley homecoming.' : 'Explore in any order. Restore all five fieldworks and finish The Lantern Signal to light the valley lantern in Frontier Crossing.'}</p>
    {!state.flags.valleyComplete && complete === 6 && <button className="journey-button is-primary" onClick={() => onTrack({ regionId: 'frontier', objectId: 'festival-lantern' })}>Track the homecoming</button>}
    <ol className="journey-almanac-projects">{projects.map(project => <li key={project.id} className={project.complete ? 'is-complete' : ''}>
      <ValleySeal regionId={project.regionId} complete={project.complete} />
      <div><h4>{project.name}<span>{project.complete ? 'Restored' : `${project.steps.filter(step => state.flags[step.flag]).length} / ${project.steps.length}`}</span></h4><p>{project.complete ? project.description : project.objective}</p>
        {!project.complete && <details><summary>Field notes</summary><p>{project.description}</p><ol>{project.steps.map((step, index) => <li key={step.flag} className={state.flags[step.flag] ? 'is-done' : ''}><span>{state.flags[step.flag] ? 'Done' : index + 1}</span>{step.objective}</li>)}</ol></details>}
      </div>
      {!project.complete && <button className="journey-button" onClick={() => onTrack({ regionId: project.targetRegionId || project.regionId, objectId: project.objectId })}>Track next step</button>}
    </li>)}</ol>
  </section>;
}
