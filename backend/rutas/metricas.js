// Rutas de /api/health (pública) y /api/metrics (administrador).
const { Router } = require("express");
const metrics = require("../controladores/metricas");
const views = require("../vistas/metricas");
const { authenticate, authorize } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");
const { ROLES } = require("../configuracion");

const router = Router();
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

router.get("/health", metrics.checkHealth);
router.get("/metrics/dashboard", adminOnly, metrics.getDashboard);
router.get("/metrics/requests", adminOnly, validateRequest(views.ListRequestLogsRequestDto), metrics.listRequests);
router.get("/metrics/requests/:id", adminOnly, validateRequest(views.RequestLogIdRequestDto), metrics.getRequest);
router.get("/metrics/services", adminOnly, metrics.getServices);

module.exports = router;
