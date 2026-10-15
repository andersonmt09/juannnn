// Agrupa todas las rutas de la API bajo /api
const { Router } = require("express");
const healthRoutes = require("./salud");
const authRoutes = require("./autenticacion");
const userRoutes = require("./usuarios");
const endpointRoutes = require("./endpoints");
const metricRoutes = require("./metricas");

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/endpoints", endpointRoutes);
router.use("/metrics", metricRoutes);

module.exports = router;
