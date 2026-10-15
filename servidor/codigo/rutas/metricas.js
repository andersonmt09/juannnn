// Rutas de métricas: /api/metrics (requieren sesión)
const { Router } = require("express");
const metricController = require("../controladores/metricas");
const { authenticate } = require("../intermediarios/autenticacion");

const router = Router();

router.get("/dashboard", authenticate, metricController.getDashboard);

module.exports = router;
