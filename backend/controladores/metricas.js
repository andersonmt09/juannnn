const { Router } = require("express");
const { asyncHandler, ROLES } = require("../configuracion");
const { authenticate, authorize } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");
const {
  ListRequestLogsRequestDto, RequestLogIdRequestDto,
  getDashboard, listRequests, getRequest, getServices, checkHealth,
} = require("../dto/metricas");

const router = Router();
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

// GET /api/health - público
router.get("/health", asyncHandler(checkHealth));
// GET /api/metrics/dashboard - admin
router.get("/metrics/dashboard", adminOnly, asyncHandler(getDashboard));
// GET /api/metrics/requests - admin
router.get("/metrics/requests", adminOnly, validateRequest(ListRequestLogsRequestDto), asyncHandler(listRequests));
// GET /api/metrics/requests/:id - admin
router.get("/metrics/requests/:id", adminOnly, validateRequest(RequestLogIdRequestDto), asyncHandler(getRequest));
// GET /api/metrics/services - admin
router.get("/metrics/services", adminOnly, asyncHandler(getServices));

module.exports = router;
