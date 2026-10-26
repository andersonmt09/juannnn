// Respuesta para rutas inexistentes y formato único para todos los errores.
const { ErrorResponseDto } = require("../vistas/comunes");
const { env, HttpError } = require("../configuracion");

// 404 con la ruta (sin query string) y el método.
function notFound(req, res, next) {
  res.locals.notFound = true; // el registro de peticiones no guarda rutas inexistentes
  const error = HttpError.notFound("Endpoint no encontrado");
  error.path = req.originalUrl.split("?")[0];
  error.method = req.method;
  next(error);
}

// Errores de body-parser traducidos al español.
function normalizeError(error) {
  if (error.type === "entity.parse.failed") {
    return HttpError.badRequest("El cuerpo de la petición no es un JSON válido");
  }
  if (error.type === "entity.too.large") {
    return new HttpError(413, "El cuerpo de la petición es demasiado grande");
  }
  return error;
}

// Formato único para todos los errores (ErrorResponseDto).
// eslint-disable-next-line no-unused-vars
function errorHandler(rawError, req, res, next) {
  const error = normalizeError(rawError);
  const statusCode = error.statusCode || 500;
  const isServerError = statusCode >= 500;

  if (isServerError) console.error("[error]", error);

  const message = isServerError && env.nodeEnv === "production" ? "Error interno del servidor" : error.message;
  res.status(statusCode).json(new ErrorResponseDto(message, {
    errors: error.details,
    code: error.code,
    path: error.path,
    method: error.method,
  }));
}

module.exports = { notFound, errorHandler };
