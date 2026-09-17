import * as s from "../services/note.service.js";
export const authors = async (req, res) =>
  res.json({ success: true, data: await s.authors(req.user) });
export const togglePin = async (req, res) =>
  res.json({ success: true, data: await s.togglePin(req.params.id, req.user) });
export const list = async (req, res) =>
  res.json({ success: true, data: await s.list(req.validatedQuery, req.user) });
export const get = async (req, res) =>
  res.json({
    success: true,
    data: await s.get(req.params.id, req.user, req.query.archived === "true"),
  });
export const create = async (req, res) =>
  res
    .status(201)
    .json({ success: true, data: await s.create(req.body, req.user) });
export const update = async (req, res) =>
  res.json({
    success: true,
    data: await s.update(req.params.id, req.body, req.user),
  });
export const archive = async (req, res) =>
  res.json({
    success: true,
    data: await s.setArchived(req.params.id, true, req.user),
  });
export const restore = async (req, res) =>
  res.json({
    success: true,
    data: await s.setArchived(req.params.id, false, req.user),
  });
export const remove = async (req, res) =>
  res.json({ success: true, data: await s.remove(req.params.id, req.user) });
export const exportDocx = async (req, res) => {
  const out = await s.exportDocx(req.validatedQuery, req.user);
  res
    .set(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )
    .set("Content-Disposition", `attachment; filename="${out.filename}"`)
    .send(out.buffer);
};
export const addImage = async (req, res) =>
  res
    .status(201)
    .json({
      success: true,
      data: await s.addImage(req.params.id, req.fileInfo, req.body, req.user),
    });
export const imageContent = async (req, res) => {
  const f = await s.imageContent(req.params.id, req.params.imageId, req.user);
  res
    .type(f.mimeType)
    .set(
      "Content-Disposition",
      `inline; filename*=UTF-8''${encodeURIComponent(f.originalFilename)}`,
    )
    .send(f.buffer);
};
export const removeImage = async (req, res) =>
  res.json({
    success: true,
    data: await s.removeImage(req.params.id, req.params.imageId, req.user),
  });
