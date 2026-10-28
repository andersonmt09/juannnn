const { Router } = require("express");

const simulationRouter = require("./simulacion");

const MODULES = [
  ["", require("./metricas")],
  ["/auth", require("./autenticacion")],
  ["/users", require("./usuarios")],
  ["/monitoring", require("./monitoreo")],
  ["/simulations", simulationRouter],
  ["/axonApi", simulationRouter],
  ["/events", require("./eventos")],
];

const router = Router();
for (const [prefix, moduleRouter] of MODULES) router.use(prefix, moduleRouter);

const NOT_MONITORABLE = new Set(["GET /api/events/stream"]);

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
