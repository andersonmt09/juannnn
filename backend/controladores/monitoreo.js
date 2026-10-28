// Controlador de /api/monitoring: recibe la petición ya validada (req.dto), llama al servicio y responde con la vista.
const { Router } = require("express");
const monitoringService = require("../servicios/monitoreo");
const { asyncHandler, ROLES } = require("../configuracion");
const { authenticate, authorize } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");
// DTO de petición (req): lo que envía el cliente
const { CreateMonitoredEndpointRequestDto, MonitoredEndpointIdRequestDto } = require("../dto/monitoreo");
// Vistas (res): lo que responde el servidor
const { MessageResponseDto } = require("../vistas/comunes");
const {
  MonitoredEndpointListResponseDto,
  MonitoredEndpointResponseDto,
  MonitoredEndpointDetailResponseDto,
  ApiRouteListResponseDto,
} = require("../vistas/monitoreo");

// ---------- Endpoints ----------
// /api/monitoring: ver con sesión; agregar y quitar, administrador.

const router = Router();
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

// GET /api/monitoring/routes (administrador)
router.get("/routes", adminOnly, listRoutes);
// GET /api/monitoring/endpoints (con sesión)
router.get("/endpoints", authenticate, asyncHandler(list));
// GET /api/monitoring/endpoints/:id (con sesión)
router.get("/endpoints/:id", authenticate, validateRequest(MonitoredEndpointIdRequestDto), asyncHandler(getById));
// POST /api/monitoring/endpoints (administrador)
router.post("/endpoints", adminOnly, validateRequest(CreateMonitoredEndpointRequestDto), asyncHandler(create));
// DELETE /api/monitoring/endpoints/:id (administrador)
router.delete("/endpoints/:id", adminOnly, validateRequest(MonitoredEndpointIdRequestDto), asyncHandler(remove));

// ---------- Funciones del controlador ----------

// Rutas reales de la API; las calcula servidor.js con listApiRoutes de controladores/index.js.
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
    { isAdmin: req.user.role === ROLES.ADMIN },
  ));
}

async function create(req, res) {
  res.status(201).json(new MonitoredEndpointResponseDto(await monitoringService.create(req.dto, apiRoutes(req))));
}

async function remove(req, res) {
  await monitoringService.remove(req.dto.id);
  res.json(new MessageResponseDto("Endpoint eliminado del monitoreo"));
}

module.exports = { router, listRoutes, list, getById, create, remove };
