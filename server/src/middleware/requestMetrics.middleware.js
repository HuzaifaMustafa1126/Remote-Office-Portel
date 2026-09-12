export function requestMetrics(req, res, next) {
  const started = process.hrtime.bigint();
  res.once("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
    const entry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      endpoint: req.originalUrl.split("?")[0],
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(1)),
    };
    if (durationMs >= 5000) console.warn("Slow request:", entry);
    else if (res.statusCode >= 500) console.error("Failed request:", entry);
  });
  next();
}
