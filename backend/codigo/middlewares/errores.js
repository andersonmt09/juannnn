// Respuesta 404 para rutas inexistentes y formato único para los errores (ErrorResponseDto).
const HttpError = require("../utilidades/error-http");
const { env } = require("../configuracion/entorno");
const { ErrorResponseDto } = require("../dtos/respuesta/comunes");

function notFound(req, res, next) {
  next(HttpError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const isServerError = statusCode >= 500;

  if (isServerError) console.error("[error]", error);

  const message = isServerError && env.nodeEnv === "production" ? "Error interno del servidor" : error.message;
  res.status(statusCode).json(new ErrorResponseDto(message, error.details));
}

module.exports = { notFound, errorHandler };
