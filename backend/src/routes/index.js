// Agrupa todas las rutas de la API bajo /api
const { Router } = require("express");
const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const endpointRoutes = require("./endpoint.routes");
const metricRoutes = require("./metric.routes");

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/endpoints", endpointRoutes);
router.use("/metrics", metricRoutes);

module.exports = router;
