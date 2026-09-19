import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import pool from "../src/config/database.js";
import * as replies from "../src/services/noteReply.service.js";
import { exportDocx, get as getNote, imageContent, publishNotifications, remove as removeNote, setArchived, togglePin } from "../src/services/note.service.js";
import { validateSchema } from "../src/services/schema.service.js";
import { getPreferences, updatePreferences } from "../src/services/notification.service.js";

let noteId, temporaryDirectory,temporaryUserId,temporaryEmployeeId;const extraNoteIds=[];
try {
  const schema = await validateSchema();
  assert.equal(schema.valid, true, `Schema validation failed: ${JSON.stringify(schema)}`);
  const unique=`notes-audit-${Date.now()}`;
  const[employeeResult]=await pool.execute("INSERT INTO employees(employee_code,first_name,last_name,email,job_title,department,joining_date,status)VALUES(?,'Notes','Audit',?,'Test','Test',CURRENT_DATE,'ACTIVE')",[unique,`${unique}@example.invalid`]);temporaryEmployeeId=employeeResult.insertId;
  const[userResult]=await pool.execute("INSERT INTO users(employee_id,email,password_hash,status)VALUES(?,?,?,'ACTIVE')",[temporaryEmployeeId,`${unique}@example.invalid`,"not-a-login-account"]);temporaryUserId=userResult.insertId;
  const defaults=await getPreferences(temporaryUserId),off={...defaults,noteEnabled:false,eventPreferences:[{eventType:"NOTE_REPLY_CREATED",inAppEnabled:false,desktopEnabled:false,soundEnabled:false},{eventType:"NOTE_REPLY_MENTION",inAppEnabled:false,desktopEnabled:false,soundEnabled:false}]};
  await updatePreferences(temporaryUserId,off);const persistedOff=await getPreferences(temporaryUserId);assert.equal(persistedOff.noteEnabled,false);assert.equal(persistedOff.eventPreferences.find(item=>item.eventType==="NOTE_REPLY_CREATED").inAppEnabled,false);
  await updatePreferences(temporaryUserId,{...persistedOff,noteEnabled:true});assert.equal((await getPreferences(temporaryUserId)).noteEnabled,true);
  const [[user]] = await pool.execute(
    "SELECT u.id,u.employee_id FROM users u JOIN employees e ON e.id=u.employee_id WHERE u.status='ACTIVE' AND e.status='ACTIVE' AND NOT EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=u.id AND UPPER(r.name)='CEO') LIMIT 1",
  );
  assert.ok(user, "An active user is required for the reply smoke test");
  const [createdNote] = await pool.execute(
    "INSERT INTO work_notes(title,summary,content,author_user_id,visibility,is_important,status,is_archived,published_at) VALUES('Reply smoke test','Temporary automated check','Temporary automated check',?,'PRIVATE',0,'PUBLISHED',0,CURRENT_TIMESTAMP)",
    [user.id],
  );
  noteId = createdNote.insertId;
  const [[ceo]]=await pool.execute("SELECT u.id,u.employee_id FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id JOIN employees e ON e.id=u.employee_id WHERE u.status='ACTIVE' AND e.status='ACTIVE' AND UPPER(r.name)='CEO' LIMIT 1");
  const [[other]]=await pool.execute("SELECT u.id,u.employee_id FROM users u JOIN employees e ON e.id=u.employee_id WHERE u.status='ACTIVE' AND e.status='ACTIVE' AND u.id<>? AND NOT EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=u.id AND UPPER(r.name)='CEO') LIMIT 1",[user.id]);
  assert.ok(ceo&&other,"A CEO and two active employees are required for the authorization smoke test");
  assert.equal((await getNote(noteId,user)).id,noteId);
  await assert.rejects(()=>getNote(noteId,ceo),(error)=>error.statusCode===403);
  await assert.rejects(()=>getNote(noteId,other),(error)=>error.statusCode===403);
  const addNote=async(visibility)=>{const[result]=await pool.execute("INSERT INTO work_notes(title,summary,content,author_user_id,visibility,is_important,status,is_archived,published_at)VALUES('Authorization smoke test','Temporary automated check','Temporary automated check',?,?,0,'PUBLISHED',0,CURRENT_TIMESTAMP)",[user.id,visibility]);extraNoteIds.push(result.insertId);return result.insertId;};
  const teamNoteId=await addNote("TEAM"),ceoNoteId=await addNote("CEO_ONLY");
  assert.equal((await getNote(teamNoteId,other)).id,teamNoteId);
  assert.equal((await getNote(ceoNoteId,ceo)).id,ceoNoteId);
  await assert.rejects(()=>getNote(ceoNoteId,other),(error)=>error.statusCode===403);
  await assert.rejects(()=>setArchived(teamNoteId,true,other),(error)=>error.statusCode===403);
  await assert.rejects(()=>removeNote(teamNoteId,other),(error)=>error.statusCode===403);
  await togglePin(teamNoteId,user);await togglePin(teamNoteId,other);
  const[[pins]]=await pool.execute("SELECT COUNT(*) total FROM note_pins WHERE note_id=?",[teamNoteId]);assert.equal(Number(pins.total),2);
  await publishNotifications(noteId, user);
  const [[privateNotifications]] = await pool.execute(
    "SELECT COUNT(*) total FROM notifications WHERE reference_type='NOTE' AND reference_id=?",
    [noteId],
  );
  assert.equal(Number(privateNotifications.total), 0);
  temporaryDirectory=await mkdtemp(path.join(tmpdir(),"notes-audit-"));
  const pngPath=path.join(temporaryDirectory,"pixel.png");
  await writeFile(pngPath,Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=","base64"));
  await pool.execute("INSERT INTO note_images(note_id,uploaded_by,storage_key,original_filename,mime_type,size_bytes)VALUES(?,?,?,?,?,?)",[noteId,user.id,pngPath,"pixel.png","image/png",68]);
  await pool.execute("INSERT INTO note_images(note_id,uploaded_by,storage_key,original_filename,mime_type,size_bytes)VALUES(?,?,?,?,?,?)",[noteId,user.id,path.join(temporaryDirectory,"missing.png"),"missing.png","image/png",68]);
  const[[privateImage]]=await pool.execute("SELECT id FROM note_images WHERE note_id=? ORDER BY id LIMIT 1",[noteId]);
  await assert.rejects(()=>imageContent(noteId,privateImage.id,other),(error)=>error.statusCode===403);
  const exported=await exportDocx({mode:"MY",sort:"NEWEST"},user);
  assert.equal(exported.buffer.subarray(0,2).toString(),"PK");
  const docxPath=path.join(temporaryDirectory,exported.filename);await writeFile(docxPath,exported.buffer);
  assert.equal(spawnSync("unzip",["-t",docxPath],{encoding:"utf8"}).status,0,"Generated DOCX must be a valid ZIP container");
  assert.deepEqual(await replies.mentionable(noteId, user), []);
  const reply = await replies.create(noteId, { content: "First reply", mentionUserIds: [] }, user);
  assert.equal(reply.content, "First reply");
  assert.equal((await replies.list(noteId, user)).length, 1);
  const edited = await replies.update(noteId, reply.id, { content: "Edited reply", mentionUserIds: [] }, user);
  assert.equal(edited.content, "Edited reply");
  await pool.execute("UPDATE work_notes SET status='ARCHIVED',is_archived=1,archived_at=CURRENT_TIMESTAMP WHERE id=?", [noteId]);
  assert.equal((await replies.list(noteId, user, true)).length, 1);
  await assert.rejects(() => replies.create(noteId, { content: "Blocked", mentionUserIds: [] }, user));
  await pool.execute("UPDATE work_notes SET status='PUBLISHED',is_archived=0,archived_at=NULL WHERE id=?", [noteId]);
  await replies.remove(noteId, reply.id, user);
  assert.equal((await replies.list(noteId, user)).length, 0);
  console.log("Note reply lifecycle smoke test passed.");
} finally {
  if (noteId) await pool.execute("DELETE FROM work_notes WHERE id=?", [noteId]);
  for(const id of extraNoteIds)await pool.execute("DELETE FROM work_notes WHERE id=?",[id]);
  if(temporaryUserId)await pool.execute("DELETE FROM users WHERE id=?",[temporaryUserId]);
  if(temporaryEmployeeId)await pool.execute("DELETE FROM employees WHERE id=?",[temporaryEmployeeId]);
  if(temporaryDirectory)await rm(temporaryDirectory,{recursive:true,force:true});
  await pool.end();
}
