import ApiError from "../utils/ApiError.js";
export const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    const r = schema.safeParse(req[source]);
    if (!r.success)
      return next(
        new ApiError(400, r.error.issues.map((i) => i.message).join(", ")),
      );
    if (source === "query") req.validatedQuery = r.data;
    else req[source] = r.data;
    next();
  };
