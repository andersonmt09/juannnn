const rateLimit = require("express-rate-limit");
const authService = require("../servicios/autenticacion");
const { ErrorResponseDto } = require("../vistas/comunes");
const { HttpError, SECURITY, normalizeEmail } = require("../configuracion");

async function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(HttpError.unauthorized());

  try {
    req.user = await authService.authenticateToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

// igual, pero el token viene en ?token= (EventSource no manda cabeceras)
async function authenticateFromQuery(req, res, next) {
  const token = typeof req.query.token === "string" ? req.query.token : null;
  if (!token) return next(HttpError.unauthorized());

  try {
    req.user = await authService.authenticateToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return next(HttpError.forbidden());
    next();
  };
}

function createRateLimiter({ max = SECURITY.RATE_LIMIT_MAX_ATTEMPTS, windowMs = SECURITY.RATE_LIMIT_WINDOW_MS, skipSuccessful = false, keyGenerator } = {}) {
  return rateLimit({
    windowMs,
    limit: max,
    skipSuccessfulRequests: skipSuccessful,
    standardHeaders: true,
    legacyHeaders: false,
    ...(keyGenerator && { keyGenerator }),
    handler: (req, res) => {
      res.status(429).json(new ErrorResponseDto("Demasiados intentos. Intenta de nuevo en 15 minutos."));
    },
  });
}

const emailKey = (req) => normalizeEmail(req.body?.email) || `ip:${req.ip}`;

// máximo 5 intentos fallidos por IP cada 15 minutos
const authRateLimiter = createRateLimiter({ skipSuccessful: true });

// el login también se limita por correo
const loginEmailLimiter = createRateLimiter({ skipSuccessful: true, keyGenerator: emailKey });

// reenvío de códigos: máximo 5 cada 15 minutos
const resendIpLimiter = createRateLimiter({ max: SECURITY.RESEND_MAX_PER_WINDOW });
const resendEmailLimiter = createRateLimiter({ max: SECURITY.RESEND_MAX_PER_WINDOW, keyGenerator: emailKey });

module.exports = {
  authenticate,
  authenticateFromQuery,
  authorize,
  createRateLimiter,
  authRateLimiter,
  loginEmailLimiter,
  resendIpLimiter,
  resendEmailLimiter,
};
