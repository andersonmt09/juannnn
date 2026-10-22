// Exige un token de acceso válido (Authorization: Bearer <token>) y deja el usuario en req.user.
const tokenService = require("../integraciones/tokens");
const HttpError = require("../utilidades/error-http");

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

module.exports = { authenticate };
