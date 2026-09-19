import * as s from "../services/task.service.js";
export async function create(req, res) {
  res
    .status(201)
    .json({ success: true, data: await s.create(req.body, req.user) });
}
export async function list(req, res) {
  res.json({ success: true, data: await s.list(req.validatedQuery, req.user) });
}
export async function get(req, res) {
  res.json({ success: true, data: await s.get(req.params.id, req.user) });
}
export async function claim(req, res) {
  res.json({ success: true, data: await s.claim(req.params.id, req.user) });
}
export async function transition(req, res) {
  res.json({
    success: true,
    data: await s.transition(req.params.id, req.body, req.user),
  });
}
export async function comment(req, res) {
  res.status(201).json({
    success: true,
    data: await s.addComment(req.params.id, req.body, req.user),
  });
}
export async function editComment(req, res) {
  res.json({
    success: true,
    data: await s.editComment(
      req.params.id,
      req.params.commentId,
      req.body.content,
      req.user,
    ),
  });
}
export async function deleteComment(req, res) {
  res.json({
    success: true,
    data: await s.deleteComment(req.params.id, req.params.commentId, req.user),
  });
}
export async function mentionableUsers(req, res) {
  res.json({
    success: true,
    data: await s.mentionableUsers(
      req.params.id,
      req.validatedQuery.search,
      req.user,
    ),
  });
}
export async function markRead(req, res) {
  res.json({
    success: true,
    data: await s.markTaskRead(req.params.id, req.user),
  });
}
export async function uploadAttachment(req, res) {
  res
    .status(201)
    .json({
      success: true,
      data: await s.uploadAttachment(
        req.params.id,
        req.fileInfo,
        req.body,
        req.user,
      ),
    });
}
export async function attachmentContent(req, res) {
  const file = await s.getAttachmentContent(
    req.params.id,
    req.params.attachmentId,
    req.user,
  );
  res
    .type(file.mimeType)
    .set(
      "Content-Disposition",
      `${req.query.download === "1" ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(file.originalFilename)}`,
    )
    .send(file.buffer);
}
export async function deleteAttachment(req, res) {
  res.json({
    success: true,
    data: await s.deleteAttachment(
      req.params.id,
      req.params.attachmentId,
      req.user,
    ),
  });
}
export async function image(req, res) {
  res.status(201).json({
    success: true,
    data: await s.addImage(req.params.id, req.body, req.user),
  });
}
export async function settings(req, res) {
  res.json({ success: true, data: await s.getSettings() });
}
export async function updateSettings(req, res) {
  res.json({ success: true, data: await s.updateSettings(req.body, req.user) });
}
export async function availability(req, res) {
  res.json({
    success: true,
    data: await s.employeeAvailability(req.params.employeeId),
  });
}
export async function remove(req, res) {
  res.json({
    success: true,
    data: await s.permanentlyDelete(req.params.id, req.user),
  });
}
export async function assign(req, res) {
  res.json({
    success: true,
    data: await s.assign(req.params.id, req.body, req.user),
  });
}
export async function duplicate(req, res) {
  res
    .status(201)
    .json({ success: true, data: await s.duplicate(req.params.id, req.user) });
}
export async function update(req, res) {
  res.json({
    success: true,
    data: await s.update(req.params.id, req.body, req.user),
  });
}
export async function publish(req, res) {
  res.json({ success: true, data: await s.publish(req.params.id, req.user) });
}
export async function schedule(req, res) {
  res.json({
    success: true,
    data: await s.schedule(
      req.params.id,
      req.body.scheduledPublishAt,
      req.user,
    ),
  });
}
export async function cancelSchedule(req, res) {
  res.json({
    success: true,
    data: await s.cancelSchedule(req.params.id, req.user),
  });
}
export async function assignees(req, res) {
  res.json({ success: true, data: await s.listAssignableEmployees() });
}
export async function uploadReference(req, res) {
  res.status(201).json({
    success: true,
    data: await s.uploadReferenceImage(
      req.params.id,
      req.fileInfo,
      req.body,
      req.user,
    ),
  });
}
export async function removeImage(req, res) {
  res.json({
    success: true,
    data: await s.removeImage(req.params.id, req.params.imageId, req.user),
  });
}
export async function claimStatus(req, res) {
  res.json({ success: true, data: await s.getClaimStatus(req.user) });
}
export async function uploadSubmission(req, res) {
  res.status(201).json({
    success: true,
    data: await s.uploadSubmissionImage(
      req.params.id,
      req.fileInfo,
      req.body,
      req.user,
    ),
  });
}
export async function uploadChanges(req, res) {
  res.status(201).json({
    success: true,
    data: await s.uploadChangesImage(
      req.params.id,
      req.fileInfo,
      req.body,
      req.user,
    ),
  });
}
export async function imageContent(req, res) {
  const image = await s.getImageContent(
    req.params.id,
    req.params.imageId,
    req.user,
  );
  res
    .type(image.mimeType)
    .set(
      "Content-Disposition",
      `inline; filename*=UTF-8''${encodeURIComponent(image.originalFilename)}`,
    )
    .send(image.buffer);
}
export async function managementList(req, res) {
  res.json({
    success: true,
    data: await s.listManagement(req.validatedQuery, req.user),
  });
}
export async function deadline(req, res) {
  res.json({
    success: true,
    data: await s.changeDeadline(req.params.id, req.body, req.user),
  });
}
export async function bulk(req, res) {
  res.json({ success: true, data: await s.bulk(req.body, req.user) });
}
export async function analytics(req, res) {
  res.json({
    success: true,
    data: await s.analytics(req.validatedQuery, req.user),
  });
}
export async function employeePerformance(req, res) {
  res.json({
    success: true,
    data: await s.employeePerformance(
      req.params.employeeId,
      req.validatedQuery,
      req.user,
    ),
  });
}
