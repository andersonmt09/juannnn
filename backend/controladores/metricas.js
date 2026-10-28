// Controlador de /api/metrics y /api/health: llama al servicio y responde con la vista.
const metricService = require("../servicios/metricas");
const { asyncHandler } = require("../configuracion");
const { DashboardResponseDto, HealthResponseDto, RequestLogListResponseDto, RequestLogDetailResponseDto, ServiceListResponseDto } = require("../vistas/metricas");
const { Router } = require("express");
const views = require("../vistas/metricas");
const { authenticate, authorize } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");
const { ROLES } = require("../configuracion");

const getDashboard = asyncHandler(async (req, res) => {
  res.json(new DashboardResponseDto(await metricService.getDashboard()));
});

const listRequests = asyncHandler(async (req, res) => {
  res.json(new RequestLogListResponseDto(await metricService.listRequests(req.dto)));
});

const getRequest = asyncHandler(async (req, res) => {
  res.json(new RequestLogDetailResponseDto(await metricService.getRequest(req.dto.id)));
});

const getServices = asyncHandler(async (req, res) => {
  res.json(new ServiceListResponseDto(await metricService.getServices()));
});

const checkHealth = asyncHandler(async (req, res) => {
  const status = await metricService.checkHealth();
  res.status(status.databaseAvailable ? 200 : 503).json(new HealthResponseDto(status));
});

// ---------- Endpoints de /api/health (pública) y /api/metrics (administrador) ----------

const router = Router();
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

// GET /api/health (público)
router.get("/health", checkHealth);
// GET /api/metrics/dashboard (administrador)
router.get("/metrics/dashboard", adminOnly, getDashboard);
// GET /api/metrics/requests (administrador)
router.get("/metrics/requests", adminOnly, validateRequest(views.ListRequestLogsRequestDto), listRequests);
// GET /api/metrics/requests/:id (administrador)
router.get("/metrics/requests/:id", adminOnly, validateRequest(views.RequestLogIdRequestDto), getRequest);
// GET /api/metrics/services (administrador)
router.get("/metrics/services", adminOnly, getServices);

module.exports = { router, getDashboard, listRequests, getRequest, getServices, checkHealth };
