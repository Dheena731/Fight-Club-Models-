import { useEffect, useRef } from 'react';

export default function GameDialog({ title, onClose, children, notice, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return <dialog ref={ref} className={`journey-dialog ${className}`} aria-label={title} onCancel={(event) => { event.preventDefault(); onClose?.(); }}>
    <div className="journey-dialog-heading"><h2>{title}</h2>{onClose && <button className="journey-button is-small" onClick={onClose} aria-label={`Close ${title}`}>Back <kbd>Esc</kbd></button>}</div>
    {notice}
    {children}
  </dialog>;
}
