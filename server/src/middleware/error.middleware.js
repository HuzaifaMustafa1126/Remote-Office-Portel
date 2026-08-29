import env from "../config/env.js";
export function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500,
    message = err.message || "Internal server error";
  if (err.code === "ER_DUP_ENTRY") {
    status = 409;
    message = "A record with that value already exists";
  }
  if (err.code?.startsWith("ER_")) {
    status = status === 500 ? 500 : status;
    if (status === 500)
      message = req.path.includes("attendance")
        ? "Unable to load attendance records"
        : "Unable to complete the database request";
  }
  if (status === 500)
    console.error({
      method: req.method,
      endpoint: req.originalUrl,
      errorCode: err.code,
      sqlMessage: err.sqlMessage,
      message: err.message,
      stack: err.stack,
    });
  res.status(status).json({
    success: false,
    message,
    ...(err.code && !err.code.startsWith("ER_") ? { code: err.code } : {}),
    ...(env.NODE_ENV === "development" && status === 500
      ? { debug: err.message }
      : {}),
  });
}
