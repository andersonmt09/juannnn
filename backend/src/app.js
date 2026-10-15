// Configuración de Express: seguridad, JSON, registro de peticiones, rutas y errores.
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { env } = require("./config/environment");
const apiRoutes = require("./routes");
const requestLogger = require("./middlewares/request-logger.middleware");
const { notFound, errorHandler } = require("./middlewares/error.middleware");

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: env.frontendOrigin.split(",").map((o) => o.trim()) }));
app.use(express.json({ limit: "1mb" }));

app.use(requestLogger);
app.use("/api", apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
