/**
 * RUTAS: Punto de entrada de la API  →  /api
 * Reúne todos los módulos. Para ver la API completa, empieza aquí.
 */
const { Router } = require("express");
const healthController = require("../controllers/health.controller");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const endpointRoutes = require("./endpoint.routes");
const metricRoutes = require("./metric.routes");

const router = Router();

router.get("/health", healthController.check);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/endpoints", endpointRoutes);
router.use("/metrics", metricRoutes);

module.exports = router;
