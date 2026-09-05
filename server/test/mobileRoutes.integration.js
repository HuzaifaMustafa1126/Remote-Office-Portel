import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createRequire } from "node:module";
process.env.NODE_ENV = "test";
process.env.DB_USER = "test";
process.env.JWT_SECRET = "test-only-secret-for-mobile-route-tests";
const { default: pool } = await import("../src/config/database.js");
const { default: app } = await import("../src/app.js");
const { signToken } = await import("../src/utils/jwt.js");
const { initializeNotifications } = await import("../src/sockets/notification.socket.js");
const { io: connect } = createRequire(new URL("../../client/package.json", import.meta.url))("socket.io-client");

test("real HTTP routes and sockets enforce mobile access while preserving session endpoints", async (t) => {
  let allowed = false;
  const expiresAt = new Date(Date.now() + 3600000).toISOString();
  t.mock.method(pool, "execute", async (sql, params) => {
    if (sql.includes("FROM auth_sessions s JOIN users")) return [[{id:"test-session", userId:7,employee_id:7,email:"test@example.com",sessionStatus:"ACTIVE",userStatus:"ACTIVE",expires_at:expiresAt}]];
    if (sql.includes("FROM users WHERE id")) return [[{id:7,status:"ACTIVE"}]];
    if (sql.includes("must_change_password AS")) return [[{id:7,name:"Test Employee",email:"test@example.com"}]];
    if (sql.startsWith("SELECT r.name")) return [[{name:allowed ? "CEO" : "Employee"}]];
    if (sql.startsWith("SELECT DISTINCT p.name")) return [allowed ? [{name:"portal.access_mobile"}] : []];
    if (sql.startsWith("SELECT 1 FROM user_roles")) return [params[1] === "portal.access_mobile" && !allowed ? [] : [{}]];
    if (sql.startsWith("UPDATE auth_sessions")) return [{affectedRows:1}];
    if (sql.startsWith("SELECT expires_at")) return [[{expiresAt}]];
    if (sql.includes("FROM work_shifts ws")) return [[]];
    throw new Error(`Unexpected query: ${sql}`);
  });
  t.mock.method(pool, "getConnection", async () => ({beginTransaction:async()=>{},commit:async()=>{},rollback:async()=>{},release:()=>{},execute:async()=>[{affectedRows:1}]}));
  const server = createServer(app);
  const socketServer = initializeNotifications(server);
  await new Promise(resolve => server.listen(0,"127.0.0.1",resolve));
  t.after(() => new Promise(resolve => socketServer.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const token = signToken({sub:7,sid:"test-session"});
  const request = (path, method="GET", device="mobile") => fetch(origin+"/api/v1"+path,{method,headers:{Authorization:`Bearer ${token}`,"X-Client-Device":device}});
  for (const path of ["/dashboard","/attendance","/leaves","/payroll","/salaries","/employees","/company-calendar","/notifications","/reports/attendance","/roles","/permissions","/audit-logs","/shifts"]) {
    const response = await request(path);
    assert.equal(response.status,403,path);
    assert.equal((await response.json()).code,"MOBILE_ACCESS_DENIED",path);
  }
  for (const [path,method] of [["/auth/me","GET"],["/auth/heartbeat","POST"],["/auth/logout","POST"]]) {
    assert.equal((await request(path,method)).status,200,path);
  }
  assert.equal((await request("/auth/change-password","PATCH")).status,403);
  assert.equal((await request("/auth/login","POST")).status,400,"login reaches credential validation");
  assert.equal((await request("/shifts","GET","tablet")).status,200);
  assert.equal((await request("/shifts","GET","desktop")).status,200);
  const deniedSocket = connect(origin,{auth:{token,deviceType:"mobile"},transports:["websocket"],reconnection:false});
  await new Promise((resolve,reject) => {
    const timeout=setTimeout(()=>reject(new Error("Missing socket denial")),3000);
    deniedSocket.once("connect_error",error=>{clearTimeout(timeout);try{assert.equal(error.data.code,"MOBILE_ACCESS_DENIED");resolve();}catch(e){reject(e);}finally{deniedSocket.disconnect();}});
  });
  allowed = true;
  assert.equal((await request("/shifts")).status,200,"authorized mobile request");
  const adminSocket = connect(origin,{auth:{token,deviceType:"mobile"},transports:["websocket"],reconnection:false});
  await new Promise((resolve,reject) => {
    const timeout=setTimeout(()=>reject(new Error("Missing admin socket connection")),3000);
    adminSocket.once("connect",()=>{clearTimeout(timeout);adminSocket.disconnect();resolve();});
    adminSocket.once("connect_error",reject);
  });
});
