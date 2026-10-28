// Endpoints de /api/health y /api/metrics: health público; metrics solo administradores.
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

// GET /api/health — público — estado de la API y la base de datos
router.get("/health", asyncHandler(checkHealth));
// GET /api/metrics/dashboard — administrador — resumen del tablero
router.get("/metrics/dashboard", adminOnly, asyncHandler(getDashboard));
// GET /api/metrics/requests — administrador — lista peticiones registradas
router.get("/metrics/requests", adminOnly, validateRequest(ListRequestLogsRequestDto), asyncHandler(listRequests));
// GET /api/metrics/requests/:id — administrador — detalle de una petición
router.get("/metrics/requests/:id", adminOnly, validateRequest(RequestLogIdRequestDto), asyncHandler(getRequest));
// GET /api/metrics/services — administrador — estado de los servicios
router.get("/metrics/services", adminOnly, asyncHandler(getServices));

module.exports = router;
