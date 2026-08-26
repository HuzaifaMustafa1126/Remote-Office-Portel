import LiveWorkTimer from './LiveWorkTimer';
export default function BreakTimer({seconds=0,running=false}){return <LiveWorkTimer seconds={seconds} running={running} className="font-mono text-xl font-bold text-amber-700"/>}
