import {getAuditLogs} from '../services/audit.service.js';export async function list(req,res){res.json({success:true,data:await getAuditLogs(req.query.limit||100)})}
