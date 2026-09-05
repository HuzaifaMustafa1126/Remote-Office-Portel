const {chromium, devices} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('fs');
const assert = require('node:assert/strict');
const root = require('node:path').resolve(__dirname, '../../..');
const permissions = [...fs.readFileSync(root+'/client/src/utils/permissions.js','utf8').matchAll(/"([a-z_]+\.[a-z_]+)"/g)].map(x=>x[1]);
const permRows = permissions.map((name,i)=>({id:i+1,name,description:name}));
const pagination = {page:1,pages:1,total:1,limit:20};
const employee = {id:7,firstName:'Ali',lastName:'Ahmed',name:'Ali Ahmed',employeeName:'Ali Ahmed',email:'ali.ahmed@example.com',employeeCode:'EMP-007',department:'Operations',designation:'Operations Manager',status:'ACTIVE',roles:['Employee'],role:'Employee',shiftName:'Evening',schedule:'18:00 → 03:00',monthlySalary:85000,configurationReady:true,missingConfiguration:[],joiningDate:'2026-01-01',phone:'03001234567'};
const record={id:1,...employee,employeeId:7,workDate:'2026-09-05',attendanceDate:'2026-09-05',clockInAt:'2026-09-05T13:00:00Z',clockOutAt:null,totalBreakMinutes:30,totalWorkMinutes:180,status:'WORKING'};
const holiday={id:1,calendarDate:'2026-09-10',title:'Company Annual Planning Day',description:'Company-wide planning and team development activities.',dayType:'COMPANY_HOLIDAY',status:'ACTIVE'};
const leave={id:1,employeeName:'Ali Ahmed',employeeCode:'EMP-007',department:'Operations',leaveType:'CASUAL',startDate:'2026-09-10',endDate:'2026-09-12',requestedDays:3,totalDays:3,reason:'Family commitments and travel.',status:'PENDING',days:[]};
const run={id:1,periodLabel:'2026-09',periodStart:'2026-09-05',periodEnd:'2026-10-05',status:'DRAFT',items:[{id:1,employee_id:7,employeeName:'Ali Ahmed',base_salary:85000,working_days:26,present_days:24,free_leave_days:1,deductible_leave_days:1,absence_days:0,leave_deduction:3200,absence_deduction:0,net_salary:81800}],adjustments:[],activity:[],days:[]};
const notifications=[{id:1,title:'Employee logged in',message:'Ali Ahmed logged in to the portal.',type:'ATTENDANCE_PORTAL_LOGIN',actionUrl:'/employees/7',isRead:0,createdAt:'2026-09-05T10:00:00Z'}];
const salary={...employee,id:1,salaryDivisor:26,currency:'PKR',effectiveFrom:'2026-01-01',effectiveUntil:null};
const accrual={configured:true,period:{start:'2026-09-05',end:'2026-10-05'},payrollStatus:'LIVE_ESTIMATE',monthlySalary:85000,salaryDivisor:26,dailyRate:3269,earnedSoFar:9807,projectedNet:85000,dailyBreakdown:[{date:'2026-09-05',classification:'PRESENT',label:'Present',earned:3269,deduction:0}],adjustments:[],processedDays:3,validPaidDays:3,presentDays:3};
const results={widths:[],access:[],themes:[],issues:[],consoleErrors:[],unknown:[]};
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 async function setup({role='CEO',width=390,mobile=false,login=true,theme='LIGHT',deny=false}={}) {
  const context=await browser.newContext({...mobile?devices['iPhone 13']:{},viewport:{width,height:900}});
  const user={id:1,name:'Test '+role,email:'test@example.com',roles:[role],permissions:permissions.filter(p=>p!=='attendance.clock'&&(p!=='portal.access_mobile'||['CEO','ADMIN','SUPER_ADMIN'].includes(role))),expiresAt:new Date(Date.now()+7*3600000).toISOString(),mustChangePassword:false};
  const requested=[];
  await context.addInitScript(({login,theme})=>{if(login)sessionStorage.setItem('rop_token','test-token');localStorage.setItem('remoteOffice.autoRefreshInterval','0');localStorage.setItem('remote-office-appearance:v1:1',JSON.stringify({mode:theme,palette:'purple'}));}, {login,theme});
  await context.route('**/socket.io/**',route=>route.fulfill({status:200,body:'0{"sid":"test","upgrades":[],"pingInterval":25000,"pingTimeout":20000}',headers:{'access-control-allow-origin':'*'}}));
  await context.route('**/api/v1/**',async route=>{
   const path=new URL(route.request().url()).pathname.replace('/api/v1',''); requested.push(path);
   if(deny&&!path.startsWith('/auth/'))return route.fulfill({status:403,json:{code:'MOBILE_ACCESS_DENIED',message:'Mobile denied'}});
   let data;
   if(path==='/auth/me')data=user;
   else if(path==='/auth/login')data={user,token:'test-token',expiresAt:user.expiresAt};
   else if(path.startsWith('/auth/'))data={user,expiresAt:user.expiresAt};
   else if(path==='/notifications/unread-count')data={count:1};
   else if(path==='/notifications/preferences')data={soundEnabled:false,attendanceNotifications:true,browserNotifications:false};
   else if(path==='/notifications')data={rows:notifications,pagination};
   else if(path==='/roles')data=[{id:1,name:'CEO',permissions,permissionIds:permissions.map((_,i)=>i+1),userCount:1},{id:2,name:'Employee',permissions:[],permissionIds:[],userCount:1}];
   else if(path==='/permissions')data=permRows;
   else if(path==='/employees')data=[employee];
   else if(path==='/employees/7')data=employee;
   else if(path.endsWith('/work-settings'))data={shifts:[],history:[],salaryProfiles:[],current:null};
   else if(path.endsWith('/salary-accrual')||path==='/salaries/my/accrual')data=accrual;
   else if(path==='/attendance/live')data={stats:{totalEmployees:1,presentToday:1,workingNow:1,onBreak:0,clockedOut:0,notClockedIn:0},employees:[record]};
   else if(path==='/attendance/activity')data=[];
   else if(path==='/attendance/today')data={status:'NOT_CLOCKED_IN',timeline:[],schedule:null,trackingEnabled:true};
   else if(path==='/attendance/reports/daily')data={date:'2026-09-05',totals:{totalEmployees:1,present:1,onBreak:0,totalWorkedMinutes:180,totalBreakMinutes:30},rows:[record]};
   else if(path==='/attendance/history')data=[record];
   else if(path.startsWith('/attendance'))data={rows:[record],pagination,summary:{},totals:{}};
   else if(path.startsWith('/company-calendar'))data=[holiday];
   else if(path==='/shifts')data=[{id:1,name:'Evening',startTime:'18:00',endTime:'03:00',shiftSpanMinutes:540,requiredWorkMinutes:480,breakAllowanceMinutes:60,graceMinutes:15,assignedEmployees:1,status:'ACTIVE'}];
   else if(path==='/payroll')data=[run];
   else if(path==='/payroll/1')data=run;
   else if(path==='/salaries')data=[salary];
   else if(path==='/salaries/my')data=salary;
   else if(path==='/leaves/summary')data={};
   else if(path==='/leaves/my')data=[leave];
   else if(path==='/leaves/1')data=leave;
   else if(path.startsWith('/leaves'))data={rows:[leave],summary:{pending:1},pagination};
   else if(path==='/audit-logs')data={rows:[{id:1,action:'USER_LOGIN',description:'Ali Ahmed signed in.',userName:'Ali Ahmed',createdAt:'2026-09-05T10:00:00Z'}],meta:pagination,summary:{todayActivity:1},users:[{id:1,name:'Ali Ahmed'}]};
   else if(path==='/reports/overview')data={totalEmployees:1};
   else if(path.startsWith('/reports/'))data={rows:[{id:1,employee:'Ali Ahmed',workDate:'2026-09-05',requiredWorkMinutes:480,status:'PRESENT'}],pagination};
   else {results.unknown.push(path);data=[];}
   await route.fulfill({json:{success:true,data,message:'Success'}});
  });
  const page=await context.newPage();
  page.on('pageerror',e=>results.consoleErrors.push({path:page.url(),message:e.message}));
  page.on('console', message => { if(message.type()==='error' && !message.text().includes('403 (Forbidden)')) results.consoleErrors.push({path:page.url(),message:message.text()}); });
  return {context,page,requested};
 }
 async function overflow(page,label) {
  const issue=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('main *')].filter(el=>{const r=el.getBoundingClientRect();return r.right>innerWidth+1&&r.width>0&&!el.closest('.overflow-x-auto,.overflow-auto');}).slice(0,8).map(el=>({tag:el.tagName,cls:el.className,text:el.textContent.slice(0,60)}))}));
  if(issue.scroll>issue.width+1)results.issues.push({label,...issue});
 }
 for(const role of ['CEO','ADMIN','Employee'])for(const [name,width,mobile]of [['desktop',1280,false],['tablet',768,false],['mobile',390,true]]){
  const {context,page,requested}=await setup({role,width,mobile});
  await page.goto('http://127.0.0.1:5175/payroll');await page.waitForTimeout(400);
  const blocked=await page.getByRole('heading',{name:'Desktop Access Required'}).count();
  assert.equal(Boolean(blocked),role==='Employee'&&name==='mobile',role+' '+name);
  if(blocked){
   for(const path of ['/dashboard','/attendance','/payroll']) {await page.goto('http://127.0.0.1:5175'+path);await page.getByRole('heading',{name:'Desktop Access Required'}).waitFor();}
   assert.equal(requested.filter(p=>!p.startsWith('/auth/')).length,0);await page.reload();await page.getByRole('heading',{name:'Desktop Access Required'}).waitFor();await page.getByRole('button',{name:'Sign Out',exact:true}).click();await page.waitForURL('**/login');assert.ok(await page.evaluate(()=>localStorage.getItem('remote-office-appearance:v1:1')),'appearance retained after sign-out');}
  results.access.push(role+' '+name+' passed');await context.close();
 }
 const paths=['/','/employees','/employees/7','/attendance','/attendance/history','/leave','/leave-requests','/payroll','/salary','/my-salary','/company-calendar','/shifts','/notifications','/notification-settings','/roles','/permissions','/audit-logs','/reports','/account-settings','/settings/appearance'];
 const {context,page}=await setup({role:'CEO',width:390});
 const loginView=await setup({login:false});
 for(const width of (process.env.FAST_AUDIT ? [] : [320,375,390,414,430,768,1024,1280,1440])){
  await page.setViewportSize({width,height:900});
  for(const path of paths){await page.goto('http://127.0.0.1:5175'+path);await page.waitForTimeout(230);if(path==='/payroll'){await page.getByRole('button').filter({hasText:'2026-09'}).click();}await overflow(page,width+' '+path);}
  await loginView.page.setViewportSize({width,height:900});await loginView.page.goto('http://127.0.0.1:5175/login');await overflow(loginView.page,width+' login');
  results.widths.push(width); console.log('Audited width',width);
 }
 await loginView.context.close();
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:5175/company-calendar');await page.getByRole('button',{name:'Open navigation'}).click();await page.getByRole('dialog',{name:'Main navigation'}).getByRole('link',{name:'Employees',exact:true}).click();assert.equal(await page.getByRole('dialog',{name:'Main navigation'}).getAttribute('inert'),'');
 await page.goto('http://127.0.0.1:5175/company-calendar');await page.getByRole('button',{name:'Add Holiday',exact:true}).click();await overflow(page,'holiday modal');await page.screenshot({path:'/private/tmp/mobile-holiday.png'});await page.getByRole('button',{name:'Close dialog'}).click();await page.screenshot({path:'/private/tmp/mobile-calendar.png'});
 await context.close();
 for (const theme of ['LIGHT','DARK','BLACK_WHITE']) {
  for (const role of ['CEO','Employee']) {
   const themed=await setup({role,mobile:true,theme});
   await themed.page.goto('http://127.0.0.1:5175/company-calendar');
   await themed.page.waitForTimeout(300);
   assert.equal(await themed.page.locator('html').getAttribute('data-theme'),theme.toLowerCase());
   await overflow(themed.page,theme+' '+role);
   await themed.page.screenshot({path:'/private/tmp/mobile-'+theme+'-'+role+'.png'});
   if(role==='CEO') {
    await themed.page.getByRole('button',{name:'Open navigation'}).click();
    const drawer=themed.page.getByRole('dialog',{name:'Main navigation'});
    await themed.page.keyboard.press('Shift+Tab');
    assert.equal(await themed.page.evaluate(()=>document.activeElement.textContent.trim()),'Sign Out');
    await themed.page.keyboard.press('Escape');
    await themed.page.getByRole('button',{name:'Add Holiday',exact:true}).click();
    await overflow(themed.page,theme+' modal');
    await themed.page.screenshot({path:'/private/tmp/mobile-'+theme+'-modal.png'});
   }
   results.themes.push(theme+' '+role+' passed');await themed.context.close();
  }
 }
 for(const role of ['CEO','Employee']) {
  const signin=await setup({role,mobile:true,login:false});
  await signin.page.goto('http://127.0.0.1:5175/login');
  await signin.page.getByLabel('Email').fill('test@example.com');
  await signin.page.locator('input[type=password]').fill('test-password');
  await signin.page.getByRole('button',{name:'Sign in',exact:true}).click();
  if(role==='Employee')await signin.page.getByRole('heading',{name:'Desktop Access Required'}).waitFor();
  else await signin.page.getByRole('button',{name:'Open navigation'}).waitFor();
  results.access.push(role+' phone login passed');await signin.context.close();
 }
 const resize=await setup({role:'Employee',width:1280});
 await resize.page.goto('http://127.0.0.1:5175/');
 await resize.page.setViewportSize({width:390,height:844});
 await resize.page.getByRole('heading',{name:'Desktop Access Required'}).waitFor();
 await resize.page.setViewportSize({width:1280,height:900});
 await resize.page.locator('.portal-content').waitFor();
 results.access.push('Employee desktop resize and recovery passed');await resize.context.close();
 const denied=await setup({role:'CEO',deny:true});await denied.page.goto('http://127.0.0.1:5175/employees');await denied.page.getByRole('heading',{name:'Desktop Access Required'}).waitFor();results.access.push('backend denial screen passed');await denied.context.close();
 assert.deepEqual(results.issues, [], 'No page overflow');assert.deepEqual(results.consoleErrors, [], 'No browser errors');assert.deepEqual(results.unknown, [], 'All API fixtures accounted for');
 fs.writeFileSync(root+(process.env.FAST_AUDIT ? '/docs/mobile-browser-interaction-results.json' : '/docs/mobile-browser-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();
})().catch(e=>{fs.writeFileSync(root+(process.env.FAST_AUDIT ? '/docs/mobile-browser-interaction-results.json' : '/docs/mobile-browser-results.json'),JSON.stringify({...results,failure:e.message},null,2));console.error(e);process.exit(1)});
