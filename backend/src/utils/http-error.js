/**
 * Error con código HTTP. Los servicios lanzan HttpError y el
 * middleware de errores lo convierte en la respuesta JSON.
 */
class HttpError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    if (details) this.details = details;
  }

  static badRequest(message, details) { return new HttpError(400, message, details); }
  static unauthorized(message = "No autenticado") { return new HttpError(401, message); }
  static forbidden(message = "Sin permisos para esta acción") { return new HttpError(403, message); }
  static notFound(message = "Recurso no encontrado") { return new HttpError(404, message); }
  static conflict(message) { return new HttpError(409, message); }
  static tooManyRequests(message = "Demasiados intentos. Intenta más tarde.") { return new HttpError(429, message); }
}

module.exports = HttpError;
