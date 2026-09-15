import * as s from "../services/ongoingWork.service.js";
export const mine=async(req,res)=>res.json({success:true,data:await s.mine(req.user)});
export const team=async(req,res)=>res.json({success:true,data:await s.team(req.user)});
export const create=async(req,res)=>res.status(201).json({success:true,data:await s.create(req.body,req.user)});
export const update=async(req,res)=>res.json({success:true,data:await s.update(req.params.id,req.body,req.user)});
export const status=async(req,res)=>res.json({success:true,data:await s.setStatus(req.params.id,req.body,req.user)});
export const remove=async(req,res)=>res.json({success:true,data:await s.remove(req.params.id,req.user)});
