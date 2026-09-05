import { useEffect, useRef, useState } from 'react';
import { Sun, Moon, Monitor, Contrast, Heart, Eye, MoreHorizontal, Check, Plus, Palette, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { PALETTES, paletteStrip, themeTokens } from '../theme/theme';
import ThemePreview from '../components/appearance/ThemePreview';
import CustomThemeModal from '../components/appearance/CustomThemeModal';
import Button from '../components/common/Button';
const modes = [['LIGHT','Light','Clean white interface',Sun],['DARK','Dark','A comfortable dark interface',Moon],['SYSTEM','System','Follow your device appearance',Monitor],['BLACK_WHITE','Black & White','A refined monochrome workspace',Contrast]];
function PaletteCard({ palette, selected, favorite, onSelect, onFavorite, onPreview, onCustomize, onReset }) {
  const [open,setOpen]=useState(false), root=useRef(null), trigger=useRef(null);
  useEffect(()=>{if(!open)return;const close=e=>{if(!root.current?.contains(e.target))setOpen(false);};const escape=e=>{if(e.key==='Escape'){setOpen(false);trigger.current?.focus();}};document.addEventListener('pointerdown',close);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',close);document.removeEventListener('keydown',escape);};},[open]);
  return <article ref={root} className={`relative rounded-2xl border bg-surface p-4 ${selected?'border-primary shadow-sm':'border-border'}`}>
    <button type="button" aria-pressed={selected} onClick={onSelect} className="block w-full rounded-xl text-left" aria-label={`Select ${palette.name}`}>
      <span className="flex h-16 overflow-hidden rounded-xl border border-border">{paletteStrip(palette).map((color,i)=><span key={i} className="flex-1" style={{backgroundColor:color}}/>)}</span>
      <span className="mt-3 flex min-h-6 items-center justify-between gap-2"><span className="font-semibold">{palette.name}</span>{selected&&<span className="flex items-center gap-1 text-xs font-bold text-primary-text"><Check size={14}/>Selected</span>}</span>
    </button>
    <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
      <button type="button" aria-label={`${favorite?'Remove':'Add'} ${palette.name} ${favorite?'from':'to'} favorites`} aria-pressed={favorite} onClick={onFavorite} className={`rounded-lg p-2 hover:bg-hover ${favorite?'text-primary-text':'text-muted-foreground'}`}><Heart size={18} fill={favorite?'currentColor':'none'}/></button>
      <div className="flex gap-1"><button type="button" aria-label={`Preview ${palette.name}`} onClick={onPreview} className="rounded-lg p-2 text-muted-foreground hover:bg-hover"><Eye size={18}/></button><button type="button" ref={trigger} aria-label={`More options for ${palette.name}`} aria-expanded={open} onClick={()=>setOpen(!open)} className="rounded-lg p-2 text-muted-foreground hover:bg-hover"><MoreHorizontal size={18}/></button></div>
    </div>
    {open&&<div className="absolute right-3 top-full z-20 mt-1 w-52 rounded-xl border border-border bg-surface p-1.5 text-sm shadow-xl">{[['Apply theme',onSelect],['Preview',onPreview],[favorite?'Remove favorite':'Add favorite',onFavorite],['Duplicate theme',()=>onCustomize(true)],['Customize',()=>onCustomize(false)],['Reset to default',onReset]].map(([label,fn])=><button type="button" key={label} onClick={()=>{fn();setOpen(false);}} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-hover">{label}</button>)}</div>}
  </article>;
}
export default function AppearancePage() {
  const theme = useTheme(), { active,saved,systemDark,persist,previewTheme,favorite,reset,storageError }=theme;
  const [editor,setEditor]=useState(null),[notice,setNotice]=useState(''),[favoritesOnly,setFavoritesOnly]=useState(false);
  const palettes=[...PALETTES,...saved.customs];
  const select=p=>{persist({...active,palette:p.id});setNotice(`${p.name} applied and saved.`);};
  const customize=(p,duplicate)=>{
    const {tokens}=themeTokens({...active,palette:p.id},systemDark);
    setEditor({name:duplicate?`${p.name} copy`:p.id.startsWith('custom-')?p.name:`${p.name} custom`,...(p.id.startsWith('custom-')&&!duplicate?{id:p.id}:{}),primary:tokens.primary,secondary:tokens.secondary,accent:tokens.accent,background:tokens.background,surface:tokens.surface,sidebar:tokens.sidebar,foreground:tokens.foreground,mutedForeground:tokens['muted-foreground'],border:tokens.border});
  };
  return <div className="mx-auto max-w-6xl pb-28">
    <p className="mb-3 text-sm text-muted-foreground"><Link to="/account-settings" className="hover:text-primary-text">Settings</Link> / Appearance</p>
    <div className="flex items-start gap-3"><span className="rounded-xl bg-primary-soft p-3 text-primary-text"><Palette size={23}/></span><div><h1 className="text-2xl font-bold">Appearance</h1><p className="mt-1 text-sm text-muted-foreground">Customize the look of your workspace.</p></div></div>
    <p className="mt-4 text-xs text-muted-foreground">Your appearance is personal. Preferences and favorites are saved for your account in this browser.</p>
    {storageError&&<p role="alert" className="mt-4 rounded-xl bg-warning-soft p-3 text-sm text-warning">{storageError}</p>}
    <p role="status" className="mt-3 min-h-5 text-sm text-primary-text">{notice}</p>
    <section className="mt-4 border-b border-border pb-7"><h2 className="text-lg font-bold">Mode</h2><p className="mt-1 text-sm text-muted-foreground">Choose the backdrop for your day.</p><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{modes.map(([id,name,description,Icon])=><button type="button" key={id} aria-pressed={active.mode===id} onClick={()=>{persist({...active,mode:id});setNotice(`${name} mode saved.`);}} className={`rounded-2xl border p-4 text-left ${active.mode===id?'border-primary bg-primary-soft':'border-border bg-surface hover:bg-hover'}`}><span className="flex items-center justify-between"><Icon size={22} className="text-primary-text"/>{active.mode===id&&<Check size={18} aria-label="Selected"/>}</span><span className="mt-3 block font-semibold">{name}</span><span className="mt-1 block text-xs text-muted-foreground">{description}</span></button>)}</div></section>
    <section className="py-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Theme Color</h2><p className="mt-1 text-sm text-muted-foreground">A signature accent, across your entire portal.</p></div><button type="button" aria-pressed={favoritesOnly} onClick={()=>setFavoritesOnly(!favoritesOnly)} className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm"><Heart size={16} fill={favoritesOnly?'currentColor':'none'}/>{favoritesOnly?'Show all':'Favorites'}</button></div>
    {active.mode==='BLACK_WHITE'&&<p className="mt-3 rounded-xl bg-secondary p-3 text-xs text-secondary-foreground">Black & White mode keeps all interface colors monochrome. Your selected accent returns when you switch to Light, Dark, or System.</p>}
    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{palettes.filter(p=>!favoritesOnly||saved.favorites.includes(p.id)).map(p=><PaletteCard key={p.id} palette={p} selected={active.palette===p.id} favorite={saved.favorites.includes(p.id)} onSelect={()=>select(p)} onFavorite={()=>favorite(p.id)} onPreview={()=>previewTheme({...active,palette:p.id})} onCustomize={duplicate=>customize(p,duplicate)} onReset={()=>{reset();setNotice('Default appearance restored.');}}/>)}<button type="button" onClick={()=>setEditor({})} className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface p-5 text-sm font-semibold text-primary-text hover:bg-hover"><Plus size={25}/>Create Custom Theme</button></div></section>
    <section className="border-t border-border pt-7"><h2 className="text-lg font-bold">Theme Preview</h2><p className="mb-4 mt-1 text-sm text-muted-foreground">A small look at your dashboard, forms, and status indicators.</p><ThemePreview preferences={active} systemDark={systemDark}/></section>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><Button variant="secondary" onClick={()=>{reset();setNotice('Default appearance restored.');}}><span className="flex items-center gap-2"><RotateCcw size={16}/>Reset to Default</span></Button><Button onClick={()=>{persist(active);setNotice('Appearance saved.');}}>Save Changes</Button></div>
    {editor&&<CustomThemeModal source={editor.name?editor:null} preferences={active} systemDark={systemDark} onClose={()=>setEditor(null)} onSave={p=>{persist({...saved,mode:'LIGHT',palette:p.id,customs:[...saved.customs.filter(x=>x.id!==p.id),p]});setEditor(null);setNotice(`${p.name} saved and applied.`);}}/>}
  </div>;
}
