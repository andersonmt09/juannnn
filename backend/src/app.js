require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const metricsRoutes = require("./routes/metricsRoutes");
const axonRoutes = require("./routes/axonRoutes");
const healthRoutes = require("./routes/healthRoutes");

const app = express();

const origins = (process.env.FRONTEND_ORIGIN || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(helmet());
app.use(cors({ origin: origins.length === 1 && origins[0] === "*" ? "*" : origins, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);

app.get("/api/health", (req, res) => res.json({ ok: true, status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/axon", axonRoutes);
app.use("/api", healthRoutes); // /api/health already covered but okay

app.use((req, res) => res.status(404).json({ ok: false, message: "Ruta no encontrada" }));
app.use(errorHandler);

module.exports = app;
