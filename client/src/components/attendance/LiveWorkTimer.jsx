import {useEffect,useState} from 'react';

export const duration=value=>{const total=Math.max(0,Number(value)||0),h=Math.floor(total/3600),m=Math.floor(total%3600/60),s=Math.floor(total%60);return `${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`};
export default function LiveWorkTimer({seconds=0,running=false,className=''}){const [elapsed,setElapsed]=useState(Number(seconds)||0);useEffect(()=>setElapsed(Number(seconds)||0),[seconds]);useEffect(()=>{if(!running)return;const timer=setInterval(()=>setElapsed(v=>v+1),1000);return()=>clearInterval(timer)},[running]);return <span className={className}>{duration(elapsed)}</span>}
