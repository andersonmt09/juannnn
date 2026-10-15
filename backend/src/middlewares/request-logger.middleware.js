// Guarda cada petición en request_logs al terminar la respuesta, sin retrasarla.
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
