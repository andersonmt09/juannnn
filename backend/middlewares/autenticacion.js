// Seguridad de las rutas: token de acceso, roles y límite de intentos en el inicio de sesión.
const rateLimit = require("express-rate-limit");
const authService = require("../servicios/autenticacion");
const { ErrorResponseDto } = require("../vistas/comunes");
const { HttpError, SECURITY } = require("../configuracion");

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

// Máximo 5 intentos fallidos por IP cada 15 minutos en las rutas de autenticación.
const authRateLimiter = rateLimit({
  windowMs: SECURITY.RATE_LIMIT_WINDOW_MS,
  limit: SECURITY.RATE_LIMIT_MAX_ATTEMPTS,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json(new ErrorResponseDto("Demasiados intentos. Intenta de nuevo en 15 minutos."));
  },
});

module.exports = { authenticate, authenticateFromQuery, authorize, authRateLimiter };
