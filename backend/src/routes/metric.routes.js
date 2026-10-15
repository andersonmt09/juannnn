// Rutas de métricas: /api/metrics (requieren sesión)
const { Router } = require("express");
const metricController = require("../controllers/metric.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = Router();

router.get("/dashboard", authenticate, metricController.getDashboard);

module.exports = router;
