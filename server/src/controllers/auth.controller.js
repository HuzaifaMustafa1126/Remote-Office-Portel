import * as service from "../services/auth.service.js";
export async function login(req, res) {
  res.json({
    success: true,
    data: await service.loginUser(req.body.email, req.body.password, {
      ip: req.ip,
      userAgent: req.get("user-agent"),
    }),
  });
}
export async function me(req, res) {
  res.json({ success: true, data: {...await service.getUserProfile(req.user.id),expiresAt:req.session.expires_at} });
}
export async function heartbeat(req,res){res.json({success:true,data:{...await service.heartbeat(req.session.id),user:await service.getUserProfile(req.user.id)}})}
export async function logout(req,res){res.json({success:true,data:await service.logoutSession(req.session.id,req.user)})}
export async function changePassword(req, res) {
  res.json({
    success: true,
    message: "Password changed successfully.",
    data: await service.changePassword(req.user.id, req.body),
  });
}
