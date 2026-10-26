// Agrupa todas las rutas de la API bajo /api y expone la lista de endpoints que existen.
const { Router } = require("express");

// [prefijo, router]: para ver todos los endpoints de la API, empieza aquí.
const MODULES = [
  ["/health", require("./salud")],
  ["/auth", require("./autenticacion")],
  ["/users", require("./usuarios")],
  ["/monitoring", require("./monitoreo")],
  ["/metrics", require("./metricas")],
];

const router = Router();
for (const [prefix, moduleRouter] of MODULES) router.use(prefix, moduleRouter);

// [{ method: "POST", path: "/api/auth/login" }, ...] — lo usa el monitoreo para validar rutas reales.
function listApiRoutes() {
  return MODULES.flatMap(([prefix, moduleRouter]) =>
    moduleRouter.stack
      .filter((layer) => layer.route)
      .flatMap((layer) =>
        Object.keys(layer.route.methods).map((method) => ({
          method: method.toUpperCase(),
          path: ("/api" + prefix + layer.route.path).replace(/\/$/, ""),
        }))
      )
  );
}

module.exports = { router, listApiRoutes };
