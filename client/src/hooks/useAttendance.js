import {useCallback,useEffect,useState} from 'react';
import * as attendance from '../services/attendance.service';
import {errorMessage} from '../utils/helpers';

export default function useAttendance(refreshMs=20000){
  const [data,setData]=useState(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState('');
  const refresh=useCallback(async(silent=false)=>{try{setData(await attendance.getToday());setError('')}catch(e){if(!silent)setError(errorMessage(e))}},[]);
  useEffect(()=>{refresh();const timer=setInterval(()=>refresh(true),refreshMs);return()=>clearInterval(timer)},[refresh,refreshMs]);
  const act=async(fn)=>{setBusy(true);setNotice('');setError('');try{const response=await fn();setData(response.data);setNotice(response.message)}catch(e){setError(errorMessage(e))}finally{setBusy(false)}};
  return {data,busy,notice,error,refresh,clockIn:()=>act(attendance.clockIn),startBreak:()=>act(attendance.startBreak),endBreak:()=>act(attendance.endBreak),clockOut:()=>act(attendance.clockOut)};
}
