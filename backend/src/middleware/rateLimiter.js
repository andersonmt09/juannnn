// Rate limiter basado en memoria (para login/registro). Para producción usar Redis.
const buckets = new Map();

function createRateLimiter({ windowMs, max, message }) {
  return function rateLimiter(req, res, next) {
    const key = (req.ip || req.socket.remoteAddress || "unknown") + ":" + (req.path || "");
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || now - b.start > windowMs) {
      b = { start: now, count: 0 };
      buckets.set(key, b);
    }
    b.count += 1;
    if (b.count > max) {
      const err = new Error(message || "Demasiadas solicitudes");
      err.statusCode = 429;
      return next(err);
    }
    next();
  };
}

module.exports = { createRateLimiter };
