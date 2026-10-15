/**
 * MIDDLEWARE: Registro de peticiones (RF-14).
 * Al terminar cada respuesta guarda método, ruta, estado y latencia.
 * Si el registro falla, la petición del usuario no se ve afectada.
 */
const RequestLog = require("../models/request-log.model");

function requestLogger(req, res, next) {
  const startedAt = Date.now();

  res.on("finish", () => {
    RequestLog.create({
      method: req.method,
      path: req.originalUrl.slice(0, 255),
      statusCode: res.statusCode,
      latencyMs: Date.now() - startedAt,
      source: req.ip || null,
      userId: req.user ? req.user.id : null,
    }).catch((error) => console.error("[request-logger]", error.message));
  });

  next();
}

module.exports = requestLogger;
