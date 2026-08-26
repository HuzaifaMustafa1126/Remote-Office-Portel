import * as s from '../services/leave.service.js';
export async function create(req,res){res.status(201).json({success:true,message:'Leave request submitted successfully.',data:await s.createLeave(req.user,req.body)})}
export async function my(req,res){res.json({success:true,data:await s.getMyLeaves(req.user)})}
export async function summary(req,res){res.json({success:true,data:await s.getSummary(req.user)})}
export async function list(req,res){res.json({success:true,data:await s.getLeaves(req.validatedQuery)})}
export async function get(req,res){res.json({success:true,data:await s.getLeave(req.params.id,req.user)})}
export async function cancel(req,res){res.json({success:true,message:'Leave request cancelled.',data:await s.cancelLeave(req.params.id,req.user)})}
export async function approve(req,res){res.json({success:true,message:'Leave request approved.',data:await s.reviewLeave(req.params.id,'APPROVED',req.body.comment,req.user)})}
export async function reject(req,res){res.json({success:true,message:'Leave request rejected.',data:await s.reviewLeave(req.params.id,'REJECTED',req.body.comment,req.user)})}
export async function monthly(req,res){res.json({success:true,data:await s.getMonthlyReport(req.validatedQuery)})}
export async function finalize(req,res){res.json({success:true,message:'Attendance day finalized.',data:await s.finalizeAttendanceDay(req.body.date,req.user)})}
