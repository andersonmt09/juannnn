// Exige que el usuario autenticado tenga uno de los roles indicados. Uso: authorize(ROLES.ADMIN)
const HttpError = require("../utilidades/error-http");

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return next(HttpError.forbidden());
    next();
  };
}

module.exports = { authorize };
