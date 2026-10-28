// Seguridad de las rutas: token de acceso, roles y límite de intentos en el inicio de sesión.
const rateLimit = require("express-rate-limit");
const authService = require("../servicios/autenticacion");
const { ErrorResponseDto } = require("../vistas/comunes");
const { HttpError, SECURITY, normalizeEmail } = require("../configuracion");

// Exige un token de acceso válido (Authorization: Bearer <token>) de un usuario que siga activo.
// Deja el usuario en req.user, con su rol actual tomado de la base de datos.
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

// Igual que authenticate, pero el token viene en ?token= (EventSource no permite cabeceras).
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

// Exige uno de los roles indicados. Uso: authorize(ROLES.ADMIN)
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return next(HttpError.forbidden());
    next();
  };
}

// Fábrica de límites. Por defecto cuenta por IP; keyGenerator permite contar por otra clave (p. ej. el correo).
// skipSuccessful: true no cuenta las respuestas exitosas (solo los intentos fallidos).
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

// Clave por correo normalizado (si el cuerpo no trae un correo de texto, cae a la IP).
const emailKey = (req) => normalizeEmail(req.body?.email) || `ip:${req.ip}`;

// Máximo 5 intentos fallidos por IP cada 15 minutos en las rutas de autenticación.
const authRateLimiter = createRateLimiter({ skipSuccessful: true });

// El login también se limita por correo (evita repartir intentos entre varias IP).
const loginEmailLimiter = createRateLimiter({ skipSuccessful: true, keyGenerator: emailKey });

// Reenvío de códigos: máx. 5 cada 15 min por IP y por correo, contando también las exitosas.
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
