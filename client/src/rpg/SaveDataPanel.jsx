import { useEffect, useRef, useState } from 'react';
import { ADVENTURE_REGIONS } from '../../../shared/rpg/adventureContent.js';
import { fromAdventureSave } from '../../../shared/rpg/adventureSave.js';
import { MAX_BACKUP_BYTES, createSaveBackup, prepareSaveRestore, restoreSaveBackup } from '../../../shared/rpg/saveBackup.js';
import CompanionArt from './CompanionArt';

export default function SaveDataPanel({ adventure, profile, onRestored }) {
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const request = useRef(0);
  const cancelButton = useRef(null);
  const fileInput = useRef(null);
  useEffect(() => () => { request.current += 1; }, []);
  useEffect(() => { (preview ? cancelButton : fileInput).current?.focus(); }, [preview]);
  const journey = preview && fromAdventureSave(preview.backup.journey);
  const companion = journey?.team.find(member => member.id === journey.activeId);

  function download() {
    setError(''); setMessage('');
    let url;
    try {
      const backup = createSaveBackup(undefined, { journey: adventure, profile });
      url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url; link.download = 'cogimon-journey.json';
      document.body.appendChild(link); link.click(); link.remove();
      setMessage('Backup download requested. Keep cogimon-journey.json somewhere safe.');
    } catch (failure) { setError(failure.message || 'The backup could not be downloaded. Please try again.'); }
    finally { if (url) setTimeout(() => URL.revokeObjectURL(url), 1000); }
  }

  async function chooseFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const id = ++request.current;
    setPreview(null); setError(''); setMessage('Reading backup…'); setBusy(true);
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('Choose a Cogimon JSON backup smaller than 256 KB. Nothing was replaced.');
      const text = await file.text();
      if (id !== request.current) return;
      setPreview(prepareSaveRestore(text)); setMessage('Backup checked. Review its contents before replacing your saves.');
    } catch (failure) {
      if (id === request.current) { setError(failure.message || 'This file could not be read. Choose it again; nothing was replaced.'); setMessage(''); fileInput.current?.focus(); }
    } finally { if (id === request.current) setBusy(false); }
  }

  function restore() {
    setError('');
    try { onRestored(restoreSaveBackup(preview)); }
    catch (failure) { setError(failure.message || 'Restore failed. Keep your backup file and try again.'); }
  }

  return <section className="journey-save-data" aria-label="Local save tools" aria-busy={busy}>
    {!preview ? <>
      <p>Take your adventure with you. A backup keeps your Journey, Locker cosmetics and best Rival Circuit record in one local file.</p>
      <p className="journey-muted">No upload or account. Provider keys, model conversations and browser settings are never included. Cosmetics remain local / unverified.</p>
      <button className="journey-button is-primary" onClick={download} disabled={busy}>Download backup</button>
      {onRestored ? <div className="journey-backup-picker"><label htmlFor="cogimon-backup-file">Choose backup file</label><input ref={fileInput} id="cogimon-backup-file" type="file" accept=".json,application/json" onChange={chooseFile} disabled={busy} /><p className="journey-muted">JSON, up to 256 KB. Selecting a file only opens a preview.</p></div>
        : <p className="journey-muted">To restore, save and return to the title screen, then open Field Guide → Save Data. Your active battle stays untouched.</p>}
    </> : <>
      <div className="journey-backup-preview"><CompanionArt id={companion.id} skinId={preview.backup.profile?.loadout.skinId} /><div><h3>{journey.trainerName}’s Journey</h3><dl>
        <dt>Companion</dt><dd>{companion.name} · Lv. {companion.level}</dd>
        <dt>Location</dt><dd>{ADVENTURE_REGIONS[journey.locationId].name}</dd>
        <dt>Chapter</dt><dd>{journey.flags.questComplete ? 'Lantern Signal restored' : journey.battle ? 'Encounter in progress' : 'The Lantern Signal · in progress'}</dd>
        <dt>Included</dt><dd>{preview.backup.scope === 'all' ? `Journey + Locker · ${preview.backup.profile.ownedIds.length} cosmetics · Circuit best ${preview.backup.circuit.bestWins}/3` : 'Journey only · your Locker and Circuit record stay unchanged'}</dd>
      </dl></div></div>
      <p><strong>This replaces your saved Journey{preview.backup.scope === 'all' ? ' and Locker on this device' : ' on this device'}.</strong> Download your current backup first if you want to keep it. A better Circuit record is never lowered.</p>
      <button className="journey-button is-small" onClick={download}>Download current backup</button>
      <p className="journey-muted">Close other Cogimon tabs before restoring. Older tabs cannot autosave over the restored Journey. Rewards remain local / unverified.</p>
      <div className="journey-inline-actions"><button ref={cancelButton} className="journey-button" onClick={() => { setPreview(null); setError(''); setMessage('Restore cancelled. Your saves are unchanged.'); }}>Cancel restore</button><button className="journey-button is-primary" onClick={restore}>Replace saves & restore</button></div>
    </>}
    {message && <p role="status" className="journey-muted">{message}</p>}
    {error && <p role="alert" className="journey-error">{error}</p>}
  </section>;
}
