// Rutas de /api/health (pública) y /api/metrics (con sesión).
const { Router } = require("express");
const metrics = require("../controladores/metricas");
const { authenticate } = require("../middlewares/autenticacion");

const router = Router();

router.get("/health", metrics.checkHealth);
router.get("/metrics/dashboard", authenticate, metrics.getDashboard);

module.exports = router;
