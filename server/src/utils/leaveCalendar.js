export function getWorkingDays(startDate,endDate){const days=[],cursor=new Date(`${startDate}T00:00:00Z`),end=new Date(`${endDate}T00:00:00Z`);while(cursor<=end){const weekday=cursor.getUTCDay();if(weekday!==0&&weekday!==6)days.push(cursor.toISOString().slice(0,10));cursor.setUTCDate(cursor.getUTCDate()+1)}return days}
export const monthKey=date=>String(date).slice(0,7);
