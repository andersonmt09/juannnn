// Registro de cada petición a la API; con estos datos se calculan las métricas y el monitoreo.
const { performance } = require("perf_hooks");
const RequestLog = require("../modelos/registro-peticion");
const eventService = require("../servicios/eventos");
const { toRoutePattern } = require("../configuracion");

const STREAM_PATH = "/api/events/stream";

// Guarda cada petición al terminar la respuesta, sin retrasarla.
// El path va siempre sin query (el stream lleva el token ahí) y el propio stream no se registra.
// route es la ruta en forma de patrón (/api/users/:id), que usa el monitoreo para agrupar.
function requestLogger(req, res, next) {
  const startedAt = Date.now();
  req.receivedAt = performance.now(); // lo usa la simulación para medir la capa API

  res.on("finish", () => {
    const path = req.originalUrl.split("?")[0].slice(0, 255);
    if (path === STREAM_PATH) return;

    const log = {
      method: req.method,
      path,
      route: toRoutePattern(path),
      statusCode: res.statusCode,
      latencyMs: Date.now() - startedAt,
      source: req.ip || null,
      userId: req.user ? req.user.id : null,
    };

    // La actividad en vivo se publica aunque falle el guardado.
    RequestLog.create(log)
      .catch((error) => console.error("[registro-peticiones]", error.message))
      .finally(() => eventService.publishActivity({ ...log, createdAt: new Date().toISOString() }));
  });

  next();
}

module.exports = { requestLogger };
