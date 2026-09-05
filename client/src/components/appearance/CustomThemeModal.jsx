import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import Button from '../common/Button';
import ThemePreview from './ThemePreview';
import { COLOR_FIELDS, themeTokens, validHex, contrast } from '../../theme/theme';
const labels = ['Primary color','Secondary color','Accent color','Background color','Surface / card color','Sidebar color','Primary text color','Secondary text color','Border color'];
export default function CustomThemeModal({ source, preferences, systemDark, onClose, onSave }) {
  const dialog = useRef(null), input = useRef(null);
  const { tokens } = themeTokens(preferences, systemDark);
  const [form, setForm] = useState(() => source || { name: '', primary: tokens.primary, secondary: tokens.secondary, accent: tokens.accent, background: tokens.background, surface: tokens.surface, sidebar: tokens.sidebar, foreground: tokens.foreground, mutedForeground: tokens['muted-foreground'], border: tokens.border });
  useEffect(() => { const prior = document.activeElement; dialog.current.showModal(); input.current.focus(); return () => prior?.focus(); }, []);
  const valid = COLOR_FIELDS.every(key=>validHex(form[key]));
  const readable = valid && ['background','surface','secondary'].every(key=>contrast(form.foreground,form[key])>=4.5 && contrast(form.mutedForeground,form[key])>=4.5);
  const draft = { ...form, id: source?.id || 'custom-preview', name: form.name.trim() || 'Custom theme' };
  const preview = { ...preferences, mode: 'LIGHT', palette: draft.id, customs: [...preferences.customs.filter(x=>x.id!==draft.id),draft] };
  return <dialog ref={dialog} aria-labelledby="custom-theme-title" onCancel={onClose} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-auto rounded-2xl border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-overlay/60">
    <form onSubmit={e=>{e.preventDefault();if(valid&&readable)onSave({...draft,id:source?.id || `custom-${crypto.randomUUID()}`});}}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface p-5"><h2 id="custom-theme-title" className="text-lg font-bold">{source ? 'Customize theme' : 'Create custom theme'}</h2><button type="button" aria-label="Close custom theme" onClick={onClose} className="rounded-lg p-2 hover:bg-hover"><X size={20}/></button></div>
      <div className="space-y-5 p-5"><label className="block text-sm font-semibold">Theme name<input ref={input} required maxLength={80} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-2 w-full rounded-xl border border-border p-3"/></label>
      <div className="grid gap-4 sm:grid-cols-2">{COLOR_FIELDS.map((key,i)=><div key={key}><label htmlFor={`hex-${key}`} className="text-sm font-semibold">{labels[i]}</label><div className="mt-1 flex gap-2"><input type="color" aria-label={`${labels[i]} picker`} value={validHex(form[key])?form[key]:'#000000'} onChange={e=>setForm({...form,[key]:e.target.value})} className="h-11 w-12 shrink-0 cursor-pointer rounded-lg border border-border p-1"/><input id={`hex-${key}`} required pattern="#[0-9a-fA-F]{6}" maxLength={7} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} className="min-w-0 flex-1 rounded-lg border border-border px-3 font-mono text-sm"/></div></div>)}</div>
      <p className="text-xs text-muted-foreground">Enter six-digit HEX colors. Custom surface colors are used in Light mode; Dark mode adapts them. Button and sidebar text contrast is automatic.</p>
      {valid&&!readable&&<p role="alert" className="rounded-xl bg-warning-soft p-3 text-sm text-warning">Choose text colors with at least 4.5:1 contrast against the background, card, and secondary colors.</p>}
      {valid&&<ThemePreview preferences={preview} systemDark={false}/>}
      </div><div className="sticky bottom-0 flex justify-end gap-3 border-t border-border bg-surface p-4"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!valid||!readable||!form.name.trim()}>Save Theme</Button></div>
    </form>
  </dialog>;
}
