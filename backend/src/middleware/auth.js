const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    const err = new Error("No autenticado");
    err.statusCode = 401;
    return next(err);
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    const err = new Error("Token inválido o expirado");
    err.statusCode = 401;
    next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const err = new Error("Sin permisos para esta acción");
      err.statusCode = 403;
      return next(err);
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole };
