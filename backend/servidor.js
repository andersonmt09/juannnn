// Servidor: configura Express (API en /api y el frontend como archivos estáticos) y lo enciende.
// Al servir el frontend desde el mismo servidor no hace falta CORS ni una URL del backend en el frontend.
const fs = require("fs");
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const { env, validateEnvironment, HttpError } = require("./configuracion");
const { router: apiRouter, listApiRoutes } = require("./controladores");
const { requestLogger } = require("./middlewares/registro-peticiones");
const { notFound, errorHandler } = require("./middlewares/errores");
const metricService = require("./servicios/metricas");
const eventService = require("./servicios/eventos");

const FRONTEND_DIR = path.join(__dirname, "..", "frontend");

// ---------- Aplicación ----------

const app = express();
app.locals.apiRoutes = listApiRoutes();

// Proxy de confianza configurable (TRUST_PROXY); por defecto no se confía en X-Forwarded-For.
app.set("trust proxy", env.trustProxy ?? false);
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "script-src": ["'self'"], // Chart.js se sirve localmente en /vendor
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
      "connect-src": ["'self'"],
      "img-src": ["'self'", "data:"],
      // Solo en producción (HTTPS); en desarrollo rompe http://localhost en Safari.
      "upgrade-insecure-requests": env.nodeEnv === "production" ? [] : null,
    },
  },
}));
app.use(express.json({ limit: "1mb" }));

// Chart.js local (dependencia npm); si no está instalada, /vendor responde 404 sin tumbar el servidor.
// (el campo "exports" de chart.js bloquea el subpath, por eso se resuelve desde la entrada principal).
let chartFile = null;
try {
  const chartDist = path.dirname(require.resolve("chart.js")); // .../chart.js/dist
  const candidate = path.join(chartDist, "chart.umd.min.js");
  chartFile = fs.existsSync(candidate) ? candidate : path.join(chartDist, "chart.umd.js");
  if (!fs.existsSync(chartFile)) chartFile = null;
} catch { /* sin chart.js */ }
app.get("/vendor/chart.umd.min.js", (req, res, next) => {
  if (!chartFile) return next(HttpError.notFound("Recurso no encontrado"));
  res.sendFile(chartFile);
});
app.use("/vendor", (req, res, next) => next(HttpError.notFound("Recurso no encontrado")));

// API
app.use("/api", requestLogger, apiRouter);
app.use("/api", notFound);

// Frontend (SPA): archivos estáticos y, para rutas sin extensión, index.html
app.use(express.static(FRONTEND_DIR));
app.get(/^[^.]*$/, (req, res) => res.sendFile(path.join(FRONTEND_DIR, "index.html")));

app.use(errorHandler);

// Cierra las conexiones SSE abiertas para que server.close no espere.
const closeStreams = () => eventService.closeAll();

// ---------- Arranque ----------
// Valida el .env, comprueba que la API de la base de datos responde e inicia el servidor.

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

// "npm start" ejecuta este archivo; las pruebas solo importan app.
if (require.main === module) start();

module.exports = app;
