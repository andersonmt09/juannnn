/**
 * MIDDLEWARE: Manejo de errores.
 * - notFound: responde 404 para rutas que no existen.
 * - errorHandler: convierte cualquier error en una respuesta JSON uniforme.
 */
const HttpError = require("../utils/http-error");
const { env } = require("../config/environment");

function notFound(req, res, next) {
  next(HttpError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const isServerError = statusCode >= 500;

  if (isServerError) console.error("[error]", error);

  res.status(statusCode).json({
    ok: false,
    message: isServerError && env.nodeEnv === "production" ? "Error interno del servidor" : error.message,
    ...(error.details ? { errors: error.details } : {}),
  });
}

module.exports = { notFound, errorHandler };
