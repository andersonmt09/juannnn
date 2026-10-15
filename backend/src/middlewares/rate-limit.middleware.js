// Máximo 5 intentos fallidos por IP cada 15 minutos en las rutas de autenticación.
const rateLimit = require("express-rate-limit");
const { SECURITY } = require("../constants/security");

const authRateLimiter = rateLimit({
  windowMs: SECURITY.RATE_LIMIT_WINDOW_MS,
  limit: SECURITY.RATE_LIMIT_MAX_ATTEMPTS,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: "Demasiados intentos. Intenta de nuevo en 15 minutos." },
});

module.exports = { authRateLimiter };
