// authenticate: exige un token válido. authorize(...roles): exige uno de los roles.
const tokenService = require("../../proveedores/tokens");
const HttpError = require("../../utilidades/error-http");

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
