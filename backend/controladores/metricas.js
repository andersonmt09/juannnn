// Controlador de /api/metrics y /api/health: llama al servicio y responde con la vista.
const { Router } = require("express");
const metricService = require("../servicios/metricas");
const { asyncHandler, ROLES } = require("../configuracion");
const { authenticate, authorize } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");
// DTO de petición (req): lo que envía el cliente
const { ListRequestLogsRequestDto, RequestLogIdRequestDto } = require("../dto/metricas");
// Vistas (res): lo que responde el servidor
const { DashboardResponseDto, HealthResponseDto, RequestLogListResponseDto, RequestLogDetailResponseDto, ServiceListResponseDto } = require("../vistas/metricas");

// ---------- Endpoints ----------
// /api/health es pública; /api/metrics es solo para administradores.

const router = Router();
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

// GET /api/health (público)
router.get("/health", asyncHandler(checkHealth));
// GET /api/metrics/dashboard (administrador)
router.get("/metrics/dashboard", adminOnly, asyncHandler(getDashboard));
// GET /api/metrics/requests (administrador)
router.get("/metrics/requests", adminOnly, validateRequest(ListRequestLogsRequestDto), asyncHandler(listRequests));
// GET /api/metrics/requests/:id (administrador)
router.get("/metrics/requests/:id", adminOnly, validateRequest(RequestLogIdRequestDto), asyncHandler(getRequest));
// GET /api/metrics/services (administrador)
router.get("/metrics/services", adminOnly, asyncHandler(getServices));

// ---------- Funciones del controlador ----------

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
  res.json(new ServiceListResponseDto(await metricService.getServices()));
}

async function checkHealth(req, res) {
  const status = await metricService.checkHealth();
  res.status(status.databaseAvailable ? 200 : 503).json(new HealthResponseDto(status));
}

module.exports = { router, getDashboard, listRequests, getRequest, getServices, checkHealth };
