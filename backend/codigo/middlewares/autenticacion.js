// Exige un token de acceso válido (Authorization: Bearer <token>) de un usuario que siga activo.
// Deja el usuario en req.user, con su rol actual tomado de la base de datos.
const authService = require("../servicios/autenticacion");
const HttpError = require("../utilidades/error-http");

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

module.exports = { authenticate };
