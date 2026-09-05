import { Users, UserCheck, CalendarDays, WalletCards, LayoutDashboard } from 'lucide-react';
import { themeTokens } from '../../theme/theme';
export default function ThemePreview({ preferences, systemDark }) {
  const { tokens } = themeTokens(preferences, systemDark);
  return <div className="theme-preview overflow-hidden rounded-2xl border border-border" style={Object.fromEntries(Object.entries(tokens).map(([k,v]) => [`--${k}`,v]))}>
    <div className="flex min-h-72">
      <div className="hidden w-32 shrink-0 bg-sidebar p-3 text-sidebar-foreground sm:block">
        <div className="mb-6 flex items-center gap-2 text-xs font-bold"><span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">A</span>Workspace</div>
        <p className="rounded-lg bg-sidebar-active p-2 text-xs font-semibold text-sidebar-active-foreground">Dashboard</p>
        {['Employees','Attendance','Payroll','Settings'].map(x=><p key={x} className="p-2 text-xs text-sidebar-muted">{x}</p>)}
      </div>
      <div className="min-w-0 flex-1 p-4 sm:p-5">
        <p className="text-xs text-muted-foreground">Your workspace, your way</p><h3 className="mt-1 flex items-center gap-2 text-lg font-bold"><LayoutDashboard size={18}/> Dashboard</h3><p className="text-xs text-muted-foreground">Welcome back. Here’s your team today.</p>
        <div className="my-4 grid grid-cols-2 gap-2 lg:grid-cols-4">{[['Employees','48',Users],['Present','42',UserCheck],['On leave','4',CalendarDays],['Payroll','Ready',WalletCards]].map(([name,value,Icon])=><div key={name} className="rounded-xl border border-border bg-surface p-3"><Icon size={15} className="mb-2 text-primary-text"/><p className="text-lg font-bold">{value}</p><p className="text-[11px] text-muted-foreground">{name}</p></div>)}</div>
        <div className="rounded-xl border border-border bg-surface p-3"><p className="text-xs font-semibold">Weekly attendance · sample data</p><div role="img" aria-label="Sample attendance chart: Monday 70%, Tuesday 90%, Wednesday 65%, Thursday 85%, Friday 75%" className="theme-preview-chart mt-3 flex h-24 items-end gap-3 border-b border-border px-3">{[70,90,65,85,75].map((height,i)=><div key={i} title={`${['Mon','Tue','Wed','Thu','Fri'][i]}: ${height}%`} className="flex-1 rounded-t" style={{height:`${height}%`,background:`var(--chart-${i+1})`}}/>)}</div><div className="mt-1 flex justify-around text-[10px] text-muted-foreground">{['Mon','Tue','Wed','Thu','Fri'].map(x=><span key={x}>{x}</span>)}</div></div>
        <div className="mt-4 flex flex-wrap gap-2"><button type="button" className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Primary button</button><button type="button" className="rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-secondary-foreground">Secondary button</button></div>
        <label className="mt-3 block text-xs font-semibold">Sample input<input aria-label="Preview input" placeholder="Search your workspace…" className="mt-1 w-full rounded-lg border border-border bg-input p-2 text-foreground"/></label>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold"><span className="rounded-full bg-success-soft px-2 py-1 text-success">✓ Approved</span><span className="rounded-full bg-warning-soft px-2 py-1 text-warning">○ Pending</span><span className="rounded-full bg-danger-soft px-2 py-1 text-danger">× Rejected</span></div>
      </div>
    </div>
  </div>;
}
