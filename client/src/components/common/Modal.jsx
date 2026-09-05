import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
export default function Modal({ open, title, onClose, children }) {
  const dialog = useRef(null), titleId = useId();
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    dialog.current?.showModal();
    return () => { dialog.current?.close(); previous?.focus(); };
  }, [open]);
  if (!open) return null;
  return <dialog ref={dialog} aria-labelledby={titleId} onCancel={onClose}
    onClick={e=>{if(e.target===dialog.current){const r=dialog.current.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose();}}}
    className="m-auto max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-2xl overflow-auto rounded-2xl border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-overlay/50">
    <div className="flex items-center justify-between border-b border-border p-5"><h2 id={titleId} className="text-lg font-bold">{title}</h2><button type="button" aria-label="Close dialog" onClick={onClose} className="rounded-lg p-3 hover:bg-hover"><X size={20}/></button></div>
    <div className="p-5">{children}</div>
  </dialog>;
}
