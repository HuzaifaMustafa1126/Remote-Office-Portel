import ApiError from "../utils/ApiError.js";

const attempts = new Map();
let requestCount = 0;
const MAX_TRACKED_KEYS = 10_000;

export const createTwofaRevealRateLimit = ({
  limit = 5,
  windowMs = 60_000,
} = {}) => {
  return (req, res, next) => {
    const now = Date.now();
    requestCount += 1;
    if (requestCount % 100 === 0)
      for (const [storedKey, value] of attempts)
        if (value.resetAt <= now) attempts.delete(storedKey);
    const route = req.route?.path || req.path;
    const key = `${req.user?.id || "anonymous"}:${req.ip || "unknown"}:${route}`;
    const current = attempts.get(key);
    if (!current || current.resetAt <= now) {
      if (!current && attempts.size >= MAX_TRACKED_KEYS) {
        const oldest = attempts.keys().next().value;
        if (oldest) attempts.delete(oldest);
      }
      attempts.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    current.count += 1;
    if (current.count > limit) {
      res.setHeader("Retry-After", Math.max(1, Math.ceil((current.resetAt - now) / 1000)));
      return next(
        new ApiError(
          429,
          "Too many credential reveal requests. Please try again shortly.",
          "TWOFA_REVEAL_RATE_LIMITED",
        ),
      );
    }
    next();
  };
};

export const resetTwofaRevealRateLimits = () => {
  attempts.clear();
  requestCount = 0;
};
