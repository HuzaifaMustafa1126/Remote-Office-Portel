import express, { Router } from "express";
import ApiError from "../utils/ApiError.js";
import * as c from "../controllers/note.controller.js";
import * as v from "../validators/note.validator.js";
import * as replyController from "../controllers/noteReply.controller.js";
import * as replyValidator from "../validators/noteReply.validator.js";
import { requirePermission as p } from "../middleware/permission.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import asyncHandler from "../utils/asyncHandler.js";
const r = Router(),
  signatures = {
    "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
    "image/png": (b) =>
      b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    "image/webp": (b) =>
      b.subarray(0, 4).toString() === "RIFF" &&
      b.subarray(8, 12).toString() === "WEBP",
  },
  types = {
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"],
  },
  raw = express.raw({ type: () => true, limit: "5mb" }),
  image = (req, res, next) => {
    const mime = String(req.headers["content-type"] || "")
        .split(";")[0]
        .toLowerCase(),
      rawName=String(req.headers["x-file-name"]||"image");
    let name;
    try{name=decodeURIComponent(rawName).replace(/[\\/\0]/g,"_").slice(0,255);}
    catch{return next(new ApiError(400,"Image filename is invalid"));}
    const
      ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
    if (!types[mime]?.includes(ext))
      return next(
        new ApiError(400, "Only JPG, PNG and WEBP images are supported"),
      );
    raw(req, res, (e) => {
      if (e) return next(e);
      if (
        !Buffer.isBuffer(req.body) ||
        !req.body.length ||
        !signatures[mime]?.(req.body)
      )
        return next(new ApiError(400, "Image content is invalid"));
      req.fileInfo = {
        mimeType: mime,
        extension: ext,
        originalFilename: name,
        sizeBytes: req.body.length,
      };
      next();
    });
  },
  positiveId=(req,res,next,value,name)=>{
    const parsed=v.identifier.safeParse(value);
    if(!parsed.success)return next(new ApiError(400,`${name} must be a positive integer`));
    req.params[name]=parsed.data;next();
  };
r.param("id",positiveId);
r.param("imageId",positiveId);
r.param("replyId",positiveId);
r.get(
  "/",
  p("notes.view_own"),
  validate(v.listSchema, "query"),
  asyncHandler(c.list),
);
r.get("/authors", p("notes.view_own"), asyncHandler(c.authors));
r.get(
  "/export/docx",
  p("notes.view_own"),
  validate(v.exportSchema, "query"),
  asyncHandler(c.exportDocx),
);
r.post(
  "/",
  p("notes.create"),
  validate(v.createSchema),
  asyncHandler(c.create),
);
r.get(
  "/:id/replies/mentionable",
  p("notes.view_own"),
  validate(replyValidator.mentionSearchSchema, "query"),
  asyncHandler(replyController.mentionable),
);
r.get("/:id/replies", p("notes.view_own"), asyncHandler(replyController.list));
r.post(
  "/:id/replies",
  p("notes.view_own"),
  validate(replyValidator.replySchema),
  asyncHandler(replyController.create),
);
r.put(
  "/:id/replies/:replyId",
  p("notes.view_own"),
  validate(replyValidator.replySchema),
  asyncHandler(replyController.update),
);
r.delete(
  "/:id/replies/:replyId",
  p("notes.view_own"),
  asyncHandler(replyController.remove),
);
r.get("/:id", p("notes.view_own"), asyncHandler(c.get));
r.put(
  "/:id",
  p("notes.edit_own"),
  validate(v.updateSchema),
  asyncHandler(c.update),
);
r.patch("/:id/pin", p("notes.view_own"), asyncHandler(c.togglePin));
r.post(
  "/:id/notifications/published",
  p("notes.create"),
  asyncHandler(c.publishNotifications),
);
r.patch("/:id/archive", p("notes.edit_own"), asyncHandler(c.archive));
r.patch("/:id/restore", p("notes.edit_own"), asyncHandler(c.restore));
r.delete("/:id", p("notes.edit_own"), asyncHandler(c.remove));
r.post("/:id/images", p("notes.edit_own"), image, asyncHandler(c.addImage));
r.get(
  "/:id/images/:imageId/content",
  p("notes.view_own"),
  asyncHandler(c.imageContent),
);
r.delete(
  "/:id/images/:imageId",
  p("notes.edit_own"),
  asyncHandler(c.removeImage),
);
export default r;
