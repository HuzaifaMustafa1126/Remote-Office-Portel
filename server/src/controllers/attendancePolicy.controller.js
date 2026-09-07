import * as service from "../services/attendancePolicy.service.js";
export async function list(req,res){res.json({success:true,data:await service.list()});}
export async function current(req,res){res.json({success:true,data:await service.current(req.query.date)});}
export async function save(req,res){res.status(201).json({success:true,data:await service.save(req.body,req.user)});}
