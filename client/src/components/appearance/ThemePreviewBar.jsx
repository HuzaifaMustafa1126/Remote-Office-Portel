import { Eye, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { paletteFor } from '../../theme/theme';
import Button from '../common/Button';
export default function ThemePreviewBar() {
  const { preview, applyPreview, cancelPreview } = useTheme();
  if (!preview) return null;
  return <div role="region" aria-label="Theme preview controls" className="fixed inset-x-3 bottom-4 z-[70] mx-auto flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary-border bg-surface p-4 text-foreground shadow-2xl">
    <p role="status" className="flex items-center gap-2 text-sm font-semibold"><Eye size={18}/>Previewing {paletteFor(preview).name}</p>
    <div className="flex gap-2"><Button onClick={applyPreview}>Apply</Button><Button variant="secondary" onClick={cancelPreview}><span className="flex items-center gap-1"><X size={14}/>Cancel</span></Button></div>
  </div>;
}
