// Registro de cada petición a la API; con estos datos se calculan las métricas y el monitoreo.
const RequestLog = require("../modelos/registro-peticion");
const { toRoutePattern } = require("../configuracion");

// Guarda cada petición al terminar la respuesta, sin retrasarla.
// route es la ruta en forma de patrón (/api/users/:id), que usa el monitoreo para agrupar.
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

module.exports = { requestLogger };
