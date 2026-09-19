import * as service from "../services/noteReply.service.js";
export const list = async (req,res) => res.json({success:true,data:await service.list(req.params.id,req.user,req.query.archived==="true")});
export const mentionable = async (req,res) => res.json({success:true,data:await service.mentionable(req.params.id,req.user,req.validatedQuery.search,req.query.archived==="true")});
export const create = async (req,res) => res.status(201).json({success:true,data:await service.create(req.params.id,req.body,req.user)});
export const update = async (req,res) => res.json({success:true,data:await service.update(req.params.id,req.params.replyId,req.body,req.user)});
export const remove = async (req,res) => res.json({success:true,data:await service.remove(req.params.id,req.params.replyId,req.user)});
