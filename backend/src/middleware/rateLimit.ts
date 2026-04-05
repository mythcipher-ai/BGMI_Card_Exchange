import rateLimit from "express-rate-limit";

export const ipRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later."
});

export const userRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => {
    return (req as any).user?.id || req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many actions in a short period. Please wait and retry."
});
