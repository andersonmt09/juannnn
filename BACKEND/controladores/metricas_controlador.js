// endpoints /api (panel, estado y registros): cada uno valida con su DTO, llama a rutas/metricas.js y responde
const { Router } = require("express");
const { asyncHandler, ROLES } = require("../config/configuracion");
const { authenticate, authorize } = require("../config/autenticacion");
const { validateRequest } = require("../config/validacion");
const { ListRequestLogsRequestDto, RequestLogIdRequestDto, DashboardResponseDto, HealthResponseDto, RequestLogListResponseDto, RequestLogDetailResponseDto, ServiceListResponseDto } = require("../esquemas/DTOs_Monitoreo_Metricas");
const metricService = require("../rutas/metricas");

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

async function getDashboard(req, res) {
  res.json(new DashboardResponseDto(await metricService.getDashboard()));
}

async function listRequests(req, res) {
  res.json(new RequestLogListResponseDto(await metricService.listRequests(req.dto)));
}

async function getRequest(req, res) {
  res.json(new RequestLogDetailResponseDto(await metricService.getRequest(req.dto.id)));
}

async function getServices(req, res) {
  res.json(new ServiceListResponseDto(await metricService.getServices(req.user)));
}

async function checkHealth(req, res) {
  const status = await metricService.checkHealth();
  res.status(status.databaseAvailable ? 200 : 503).json(new HealthResponseDto(status));
}

module.exports = { prefijo: "", router };
