import * as service from "../services/notificationSound.service.js";
export async function configuration(req,res){res.json({success:true,data:await service.getConfiguration()});}
export async function upload(req,res){res.status(201).json({success:true,data:await service.uploadSound(req.fileInfo,req.body,req.headers["x-sound-name"],req.user)});}
export async function rename(req,res){res.json({success:true,data:await service.renameSound(req.params.id,req.body.name,req.user)});}
export async function settings(req,res){res.json({success:true,data:await service.setConfiguration(req.body,req.user)});}
export async function remove(req,res){res.json({success:true,data:await service.deleteSound(req.params.id,req.user)});}
export async function content(req,res){const file=await service.getContent(req.params.id);res.type(file.mimeType).set("Cache-Control","private, max-age=3600").set("Content-Disposition",`inline; filename*=UTF-8''${encodeURIComponent(file.originalName)}`).send(file.buffer);}
