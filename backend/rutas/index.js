// Junta las rutas de la API (servidor.js las monta en /api).
// Para ver todos los endpoints, abre los archivos de esta carpeta: cada línea dice método, ruta,
// quién puede entrar, qué vista de petición valida los datos y qué controlador responde.
const { Router } = require("express");

const simulationRouter = require("./simulacion");

const MODULES = [
  ["", require("./metricas")], // /health y /metrics/dashboard
  ["/auth", require("./autenticacion")],
  ["/users", require("./usuarios")],
  ["/monitoring", require("./monitoreo")],
  ["/simulations", simulationRouter],
  ["/axonApi", simulationRouter], // alias del documento para la simulación
  ["/events", require("./eventos")],
];

const router = Router();
for (const [prefix, moduleRouter] of MODULES) router.use(prefix, moduleRouter);

// El stream SSE no se puede monitorear (no se registra como petición).
const NOT_MONITORABLE = new Set(["GET /api/events/stream"]);

// [{ method: "POST", path: "/api/auth/login" }, ...] — lo usa el monitoreo para aceptar solo rutas reales.
function listApiRoutes() {
  return MODULES.flatMap(([prefix, moduleRouter]) =>
    moduleRouter.stack
      .filter((layer) => layer.route)
      .flatMap((layer) => Object.keys(layer.route.methods).map((method) => ({
        method: method.toUpperCase(),
        path: ("/api" + prefix + layer.route.path).replace(/\/$/, ""),
      })))
  ).filter((r) => !NOT_MONITORABLE.has(`${r.method} ${r.path}`));
}

module.exports = { router, listApiRoutes };
