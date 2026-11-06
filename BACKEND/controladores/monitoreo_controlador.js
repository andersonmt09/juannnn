// endpoints /api/monitoring: cada uno valida con su DTO, llama a rutas/monitoreo.js y responde
const { Router } = require("express");
const { asyncHandler, ROLES } = require("../config/configuracion");
const { authenticate, authorize } = require("../config/autenticacion");
const { validateRequest } = require("../config/validacion");
const {
  CreateMonitoredEndpointRequestDto, MonitoredEndpointIdRequestDto,
  MonitoredEndpointListResponseDto, MonitoredEndpointResponseDto, MonitoredEndpointDetailResponseDto, ApiRouteListResponseDto,
} = require("../esquemas/DTOs_Monitoreo_Metricas");
const monitoringService = require("../rutas/monitoreo");
const { MessageResponseDto } = require("../esquemas/DTOs_Comunes");

const router = Router();
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

// GET /api/monitoring/routes - admin
router.get("/routes", adminOnly, listRoutes);
// GET /api/monitoring/endpoints - con sesión
router.get("/endpoints", authenticate, asyncHandler(list));
// GET /api/monitoring/endpoints/:id - con sesión
router.get("/endpoints/:id", authenticate, validateRequest(MonitoredEndpointIdRequestDto), asyncHandler(getById));
// POST /api/monitoring/endpoints - admin
router.post("/endpoints", adminOnly, validateRequest(CreateMonitoredEndpointRequestDto), asyncHandler(create));
// DELETE /api/monitoring/endpoints/:id - admin
router.delete("/endpoints/:id", adminOnly, validateRequest(MonitoredEndpointIdRequestDto), asyncHandler(remove));

const apiRoutes = (req) => req.app.locals.apiRoutes || [];

function listRoutes(req, res) {
  res.json(new ApiRouteListResponseDto(apiRoutes(req)));
}

async function list(req, res) {
  res.json(new MonitoredEndpointListResponseDto(await monitoringService.list()));
}

async function getById(req, res) {
  res.json(new MonitoredEndpointDetailResponseDto(
    await monitoringService.getById(req.dto.id),
    { isAdmin: req.user.isAdmin() },
  ));
}

async function create(req, res) {
  res.status(201).json(new MonitoredEndpointResponseDto(await monitoringService.create(req.dto, apiRoutes(req))));
}

async function remove(req, res) {
  await monitoringService.remove(req.dto.id);
  res.json(new MessageResponseDto("Endpoint eliminado del monitoreo"));
}

module.exports = { prefijo: "/monitoring", router };
