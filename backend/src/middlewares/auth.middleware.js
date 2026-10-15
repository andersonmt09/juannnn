/**
 * MIDDLEWARE: Autenticación y autorización.
 * - authenticate: exige un access token válido (Authorization: Bearer <token>).
 * - authorize(...roles): exige que el usuario tenga uno de los roles indicados.
 */
const tokenService = require("../services/token.service");
const HttpError = require("../utils/http-error");

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(HttpError.unauthorized());

  try {
    req.user = tokenService.verifyAccessToken(token);
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

module.exports = { authenticate, authorize };
