/**
 * RUTAS: Métricas  →  /api/metrics   (requieren sesión)
 */
const { Router } = require("express");
const metricController = require("../controllers/metric.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = Router();

router.get("/dashboard", authenticate, metricController.getDashboard); // RF-11

module.exports = router;
