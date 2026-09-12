import * as service from "../services/loginSecurity.service.js";
export async function list(req,res){res.json({success:true,data:await service.list(req.validatedQuery)})}
export async function summary(req,res){res.json({success:true,data:await service.summary()})}
export async function revoke(req,res){res.json({success:true,message:"Session terminated.",data:await service.revoke(req.params.sessionId,req.user)})}
