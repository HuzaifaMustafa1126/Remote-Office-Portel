import { mkdir,readFile,unlink,writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import pool from "../config/database.js";
import ApiError from "../utils/ApiError.js";

const uploadDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../../uploads/notification-sounds");
const select=`SELECT id,name,original_name originalName,mime_type mimeType,size_bytes sizeBytes,builtin_key builtinKey,is_builtin isBuiltin,is_default isDefault,created_at createdAt FROM notification_sounds WHERE deleted_at IS NULL`;
const normalize=row=>({...row,id:Number(row.id),isBuiltin:Boolean(row.isBuiltin),isDefault:Boolean(row.isDefault),url:row.isBuiltin?null:`/notifications/sounds/${row.id}/content`});
export async function getConfiguration(){
  const [[settings],[sounds],[assignments]]=await Promise.all([
    pool.execute("SELECT default_sound_id defaultSoundId,normal_volume normalVolume,important_volume importantVolume,warning_volume warningVolume,critical_volume criticalVolume FROM notification_sound_settings WHERE id=1"),
    pool.execute(`${select} ORDER BY is_builtin DESC,name`),
    pool.execute("SELECT scope_type scopeType,scope_key scopeKey,sound_id soundId FROM notification_sound_assignments ORDER BY scope_type,scope_key"),
  ]);
  return {settings:{...settings[0],defaultSoundId:Number(settings[0]?.defaultSoundId||0)},sounds:sounds.map(normalize),assignments:assignments.map(x=>({...x,soundId:Number(x.soundId) }))};
}
export async function uploadSound(file,buffer,name,user){
  const safeName=String(name||file.originalFilename.replace(/\.[^.]+$/,"" )).trim().slice(0,100);
  if(!safeName)throw new ApiError(400,"Sound name is required");
  await mkdir(uploadDir,{recursive:true});const storage=path.join(uploadDir,`${randomUUID()}.${file.extension}`);
  await writeFile(storage,buffer,{flag:"wx"});
  try{const[r]=await pool.execute("INSERT INTO notification_sounds(name,original_name,storage_key,mime_type,size_bytes,uploaded_by) VALUES(?,?,?,?,?,?)",[safeName,file.originalFilename,storage,file.mimeType,file.sizeBytes,user.id]);
    await audit(user,"NOTIFICATION_SOUND_UPLOADED",r.insertId,`Notification sound ${safeName} was uploaded.`);const[[row]]=await pool.execute(`${select} AND id=?`,[r.insertId]);return normalize(row);
  }catch(error){await unlink(storage).catch(()=>{});throw error;}
}
export async function renameSound(id,name,user){const[r]=await pool.execute("UPDATE notification_sounds SET name=? WHERE id=? AND is_builtin=FALSE AND deleted_at IS NULL",[name,id]);if(!r.affectedRows)throw new ApiError(404,"Uploaded sound not found");await audit(user,"NOTIFICATION_SOUND_RENAMED",id,`Notification sound was renamed to ${name}.`);return getConfiguration();}
export async function setConfiguration(data,user){
  const c=await pool.getConnection();try{await c.beginTransaction();const[[sound]]=await c.execute("SELECT id FROM notification_sounds WHERE id=? AND deleted_at IS NULL",[data.defaultSoundId]);if(!sound)throw new ApiError(400,"Selected default sound is unavailable");
    await c.execute("UPDATE notification_sounds SET is_default=(id=?) WHERE deleted_at IS NULL",[data.defaultSoundId]);
    await c.execute("UPDATE notification_sound_settings SET default_sound_id=?,normal_volume=?,important_volume=?,warning_volume=?,critical_volume=?,updated_by=? WHERE id=1",[data.defaultSoundId,data.normalVolume,data.importantVolume,data.warningVolume,data.criticalVolume,user.id]);
    await c.execute("DELETE FROM notification_sound_assignments");
    for(const x of data.assignments){const[[available]]=await c.execute("SELECT id FROM notification_sounds WHERE id=? AND deleted_at IS NULL",[x.soundId]);if(!available)throw new ApiError(400,"An assigned sound is unavailable");await c.execute("INSERT INTO notification_sound_assignments(scope_type,scope_key,sound_id,updated_by) VALUES(?,?,?,?)",[x.scopeType,x.scopeKey,x.soundId,user.id]);}
    await c.execute("INSERT INTO audit_logs(user_id,employee_id,action,entity_type,description,new_values) VALUES(?,?,?,'NOTIFICATION_SOUND',?,?)",[user.id,user.employee_id,"NOTIFICATION_SOUND_SETTINGS_UPDATED","Company notification sound settings were updated.",JSON.stringify(data)]);await c.commit();return getConfiguration();
  }catch(e){await c.rollback();throw e;}finally{c.release();}
}
export async function deleteSound(id,user){let storage;const c=await pool.getConnection();try{await c.beginTransaction();const[[row]]=await c.execute("SELECT name,storage_key FROM notification_sounds WHERE id=? AND is_builtin=FALSE AND deleted_at IS NULL FOR UPDATE",[id]);if(!row)throw new ApiError(404,"Uploaded sound not found");storage=row.storage_key;const[[fallback]]=await c.execute("SELECT id FROM notification_sounds WHERE builtin_key='STANDARD'");await c.execute("UPDATE notification_sound_settings SET default_sound_id=? WHERE default_sound_id=?",[fallback.id,id]);await c.execute("DELETE FROM notification_sound_assignments WHERE sound_id=?",[id]);await c.execute("UPDATE notification_sounds SET deleted_at=CURRENT_TIMESTAMP,is_default=FALSE WHERE id=?",[id]);await c.execute("INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description)VALUES(?,?,?,'NOTIFICATION_SOUND',?,?)",[user.id,user.employee_id,"NOTIFICATION_SOUND_DELETED",id,`Notification sound ${row.name} was deleted.`]);await c.commit();}catch(e){await c.rollback();throw e;}finally{c.release();}
  try{await unlink(storage);}catch{await pool.execute("UPDATE notification_sounds SET deleted_at=NULL WHERE id=?",[id]);throw new ApiError(500,"Unable to delete the sound file safely");}return getConfiguration();
}
export async function getContent(id){const[[row]]=await pool.execute("SELECT storage_key storageKey,mime_type mimeType,original_name originalName FROM notification_sounds WHERE id=? AND is_builtin=FALSE AND deleted_at IS NULL",[id]);if(!row)throw new ApiError(404,"Sound not found");return{...row,buffer:await readFile(row.storageKey)};}
async function audit(user,action,id,description){await pool.execute("INSERT INTO audit_logs(user_id,employee_id,action,entity_type,entity_id,description)VALUES(?,?,?,'NOTIFICATION_SOUND',?,?)",[user.id,user.employee_id,action,id,description]);}
