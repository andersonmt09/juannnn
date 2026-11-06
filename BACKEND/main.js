// BACKEND/main.js: arranca el servidor y registra todos los controladores
const fs = require("fs");
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const { env, validateEnvironment, HttpError } = require("./config/configuracion");
const { requestLogger } = require("./config/registro_peticiones");
const { notFound, errorHandler } = require("./config/errores");
const metricService = require("./rutas/metricas");
const eventService = require("./rutas/eventos");

// controladores = archivos con los endpoints; rutas = la lógica que usan
const CONTROLADORES = [
  require("./controladores/metricas_controlador"),
  require("./controladores/autenticacion_controlador"),
  require("./controladores/usuarios_controlador"),
  require("./controladores/monitoreo_controlador"),
  require("./controladores/simulacion_controlador"),
  require("./controladores/eventos_controlador"),
];

const apiRouter = express.Router();
for (const { prefijo, router } of CONTROLADORES) {
  for (const p of [].concat(prefijo)) apiRouter.use(p, router);
}

// el stream no se puede vigilar
const NOT_MONITORABLE = new Set(["GET /api/events/stream"]);

function listApiRoutes() {
  return CONTROLADORES.flatMap(({ prefijo, router }) => [].concat(prefijo).flatMap((p) =>
    router.stack
      .filter((layer) => layer.route)
      .flatMap((layer) => Object.keys(layer.route.methods).map((method) => ({
        method: method.toUpperCase(),
        path: ("/api" + p + layer.route.path).replace(/\/$/, ""),
      })))
  )).filter((r) => !NOT_MONITORABLE.has(`${r.method} ${r.path}`));
}

const FRONTEND_DIR = path.join(__dirname, "..", "FRONTEND");

const app = express();
app.locals.apiRoutes = listApiRoutes();

// proxy de confianza (TRUST_PROXY), por defecto no se confía en X-Forwarded-For
app.set("trust proxy", env.trustProxy ?? false);
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
      "connect-src": ["'self'"],
      "img-src": ["'self'", "data:"],
      // solo en producción (HTTPS)
      "upgrade-insecure-requests": env.nodeEnv === "production" ? [] : null,
    },
  },
}));
app.use(express.json({ limit: "1mb" }));

// chart.js local; si no está, /vendor responde 404
let chartFile = null;
try {
  const chartDist = path.dirname(require.resolve("chart.js"));
  const candidate = path.join(chartDist, "chart.umd.min.js");
  chartFile = fs.existsSync(candidate) ? candidate : path.join(chartDist, "chart.umd.js");
  if (!fs.existsSync(chartFile)) chartFile = null;
} catch { /* sin chart.js */ }
app.get("/vendor/chart.umd.min.js", (req, res, next) => {
  if (!chartFile) return next(HttpError.notFound("Recurso no encontrado"));
  res.sendFile(chartFile);
});
app.use("/vendor", (req, res, next) => next(HttpError.notFound("Recurso no encontrado")));

app.use("/api", requestLogger, apiRouter);
app.use("/api", notFound);

// FRONTEND: una página por pantalla en vistas/
app.use(express.static(FRONTEND_DIR, { index: false }));
app.get("/", (req, res) => res.redirect("/vistas/inicio-sesion.html"));
app.get(/^[^.]*$/, (req, res) => res.redirect("/"));

app.use(errorHandler);

// cierra las conexiones SSE abiertas
const closeStreams = () => eventService.closeAll();

async function start() {
  validateEnvironment();

  const { databaseAvailable } = await metricService.checkHealth();
  if (!databaseAvailable) {
    console.error(`[bd] No se pudo contactar la API de la base de datos (${env.databaseApi.url})`);
    console.error("     Revisa DATABASE_API_URL y DATABASE_API_KEY en backend/.env");
    process.exit(1);
  }
  console.log(`[bd] API de la base de datos disponible (${env.databaseApi.url})`);

  const server = app.listen(env.port, () => {
    console.log(`[axon] Aplicación en http://localhost:${env.port}  ·  API en http://localhost:${env.port}/api`);
  });

  const shutdown = (signal) => {
    console.log(`\n[axon] ${signal} recibido. Cerrando...`);
    closeStreams();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

if (require.main === module) start();

module.exports = app;
module.exports.listApiRoutes = listApiRoutes;
