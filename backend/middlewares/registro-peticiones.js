const { performance } = require("perf_hooks");
const RequestLog = require("../modelos/registro-peticion");
const eventService = require("../servicios/eventos");
const { toRoutePattern } = require("../configuracion");

const STREAM_PATH = "/api/events/stream";

// el stream y las rutas 404 no se registran
function requestLogger(req, res, next) {
  const startedAt = Date.now();
  req.receivedAt = performance.now();

  res.on("finish", () => {
    const path = req.originalUrl.split("?")[0].slice(0, 255);
    if (path === STREAM_PATH || res.locals.notFound) return;

    const log = {
      method: req.method,
      path,
      route: toRoutePattern(path),
      statusCode: res.statusCode,
      latencyMs: Date.now() - startedAt,
      source: req.ip || null,
      userId: req.user ? req.user.id : null,
    };

    let id = null;
    RequestLog.create(log)
      .then((newId) => { id = newId; })
      .catch((error) => console.error("[registro-peticiones]", error.message))
      .finally(() => eventService.publishActivity({ ...log, id, createdAt: new Date().toISOString() }));
  });

  next();
}

module.exports = { requestLogger };
