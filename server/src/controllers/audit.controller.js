import {searchAuditLogs} from '../services/audit.service.js';export async function list(req,res){res.json({success:true,data:await searchAuditLogs(req.validatedQuery)})}
