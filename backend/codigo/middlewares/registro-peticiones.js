// Guarda cada petición a la API al terminar la respuesta, sin retrasarla.
// route es la ruta en forma de patrón (/api/users/:id), que usa el monitoreo para agrupar.
const RequestLog = require("../modelos/registro-peticion");
const { toRoutePattern } = require("../utilidades/validaciones");

function requestLogger(req, res, next) {
  const startedAt = Date.now();

  res.on("finish", () => {
    RequestLog.create({
      method: req.method,
      path: req.originalUrl.slice(0, 255),
      route: toRoutePattern(req.originalUrl),
      statusCode: res.statusCode,
      latencyMs: Date.now() - startedAt,
      source: req.ip || null,
      userId: req.user ? req.user.id : null,
    }).catch((error) => console.error("[registro-peticiones]", error.message));
  });

  next();
}

module.exports = requestLogger;
