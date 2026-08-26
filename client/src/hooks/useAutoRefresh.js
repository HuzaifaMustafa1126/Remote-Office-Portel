import {useCallback,useEffect,useRef,useState} from 'react';

export default function useAutoRefresh({interval=30000,enabled=true,onRefresh}){
  const callbackRef=useRef(onRefresh),runningRef=useRef(false),remainingRef=useRef(Math.ceil(interval/1000));
  const [refreshing,setRefreshing]=useState(false),[lastUpdated,setLastUpdated]=useState(null),[error,setError]=useState(''),[countdown,setCountdown]=useState(remainingRef.current);
  useEffect(()=>{callbackRef.current=onRefresh},[onRefresh]);
  const reset=useCallback(()=>{const seconds=Math.ceil(interval/1000);remainingRef.current=seconds;setCountdown(seconds)},[interval]);
  const refresh=useCallback(async()=>{if(runningRef.current)return false;runningRef.current=true;setRefreshing(true);setError('');try{await callbackRef.current();setLastUpdated(new Date());reset();return true}catch{setError('Unable to refresh data.');return false}finally{runningRef.current=false;setRefreshing(false)}},[reset]);
  useEffect(()=>{reset()},[reset]);
  useEffect(()=>{if(!enabled)return;refresh()},[enabled,refresh]);
  useEffect(()=>{if(!enabled||interval===0)return;const timer=setInterval(()=>{if(document.visibilityState!=='visible')return;remainingRef.current-=1;if(remainingRef.current<=0){reset();refresh()}else setCountdown(remainingRef.current)},1000);return()=>clearInterval(timer)},[enabled,interval,refresh,reset]);
  useEffect(()=>{if(!enabled||interval===0)return;const visible=()=>{if(document.visibilityState==='visible')refresh()};document.addEventListener('visibilitychange',visible);return()=>document.removeEventListener('visibilitychange',visible)},[enabled,interval,refresh]);
  return{refresh,refreshing,lastUpdated,error,countdown};
}
