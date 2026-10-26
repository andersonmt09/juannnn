// Configuración de Express: seguridad, JSON, API en /api y el frontend como archivos estáticos.
// Al servir el frontend desde el mismo servidor no hace falta CORS ni una URL del backend en el frontend.
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const { router: apiRouter, listApiRoutes } = require("./rutas/indice");
const requestLogger = require("./middlewares/registro-peticiones");
const { notFound, errorHandler } = require("./middlewares/errores");

const FRONTEND_DIR = path.join(__dirname, "..", "..", "frontend");

const app = express();
app.locals.apiRoutes = listApiRoutes();

app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "script-src": ["'self'", "https://cdn.jsdelivr.net"], // Chart.js
    },
  },
}));
app.use(express.json({ limit: "1mb" }));

// API
app.use("/api", requestLogger, apiRouter);
app.use("/api", notFound);

// Frontend (SPA): archivos estáticos y, para cualquier otra ruta, index.html
app.use(express.static(FRONTEND_DIR));
app.get("*", (req, res) => res.sendFile(path.join(FRONTEND_DIR, "index.html")));

app.use(errorHandler);

module.exports = app;
