import {useCallback,useEffect,useState} from 'react';
import {Users,UserCheck,Coffee,LogOut,UserMinus,BriefcaseBusiness} from 'lucide-react';
import AttendanceStatusCard from '../components/attendance/AttendanceStatusCard';
import AttendanceTimeline from '../components/attendance/AttendanceTimeline';
import LiveActivityFeed from '../components/attendance/LiveActivityFeed';
import LiveOfficeStatus from '../components/attendance/LiveOfficeStatus';
import Loader from '../components/common/Loader';
import StatCard from '../components/dashboard/StatCard';
import useAttendance from '../hooks/useAttendance';
import useAuth from '../hooks/useAuth';
import usePermission from '../hooks/usePermission';
import * as attendance from '../services/attendance.service';
import {PERMISSIONS as P} from '../utils/permissions';

export default function DashboardPage(){
  const {user}=useAuth(),canClock=usePermission(P.ATTENDANCE_CLOCK),canViewAll=usePermission(P.ATTENDANCE_ALL);
  const own=useAttendance(),[live,setLive]=useState(null),[activity,setActivity]=useState([]);
  const refreshOffice=useCallback(async()=>{if(!canViewAll)return;const [office,events]=await Promise.all([attendance.getLive(),attendance.getActivity()]);setLive(office);setActivity(events)},[canViewAll]);
  useEffect(()=>{refreshOffice();const timer=setInterval(refreshOffice,20000);return()=>clearInterval(timer)},[refreshOffice]);
  if(canClock&&!own.data)return <Loader/>;
  return <><div className="mb-7"><h1 className="text-2xl font-bold">Welcome, {user.name}</h1><p className="mt-1 text-slate-500">Your live remote office control center.</p></div>{own.notice&&<div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{own.notice}</div>}{own.error&&<div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{own.error}</div>}{canClock&&<div className="grid gap-6 xl:grid-cols-[1.4fr_.6fr]"><AttendanceStatusCard data={own.data} busy={own.busy} actions={{onClockIn:own.clockIn,onStartBreak:own.startBreak,onEndBreak:own.endBreak,onClockOut:own.clockOut}}/><AttendanceTimeline items={own.data.timeline}/></div>}{canViewAll&&live&&<><div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-6"><StatCard label="Total Employees" value={live.stats.totalEmployees} icon={Users}/><StatCard label="Present Today" value={live.stats.presentToday} icon={UserCheck} tone="emerald"/><StatCard label="Working Now" value={live.stats.workingNow} icon={BriefcaseBusiness} tone="emerald"/><StatCard label="On Break" value={live.stats.onBreak} icon={Coffee}/><StatCard label="Clocked Out" value={live.stats.clockedOut} icon={LogOut} tone="slate"/><StatCard label="Not Clocked In" value={live.stats.notClockedIn} icon={UserMinus} tone="slate"/></div><div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_.5fr]"><LiveOfficeStatus employees={live.employees}/><LiveActivityFeed items={activity}/></div></>}</>
}
