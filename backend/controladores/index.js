// Une los controladores de la API (servidor.js la monta en /api).
// Cada controlador declara sus propios endpoints: abre el archivo para ver método, ruta,
// quién puede entrar, qué DTO de petición valida los datos y qué función responde.
const { Router } = require("express");

const simulationRouter = require("./simulacion").router;

const MODULES = [
  ["", require("./metricas").router], // /health y /metrics/dashboard
  ["/auth", require("./autenticacion").router],
  ["/users", require("./usuarios").router],
  ["/monitoring", require("./monitoreo").router],
  ["/simulations", simulationRouter],
  ["/axonApi", simulationRouter], // alias del documento para la simulación
  ["/events", require("./eventos").router],
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
