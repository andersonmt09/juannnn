// Controlador de /api/monitoring: recibe la petición ya validada (req.dto), llama al servicio y responde con la vista.
const monitoringService = require("../servicios/monitoreo");
const { asyncHandler, ROLES } = require("../configuracion");
const { MessageResponseDto } = require("../vistas/comunes");
const {
  MonitoredEndpointListResponseDto,
  MonitoredEndpointResponseDto,
  MonitoredEndpointDetailResponseDto,
  ApiRouteListResponseDto,
} = require("../vistas/monitoreo");
const { Router } = require("express");
const views = require("../vistas/monitoreo");
const { authenticate, authorize } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");


// Rutas reales de la API; las calcula servidor.js con listApiRoutes de controladores/index.js.
const apiRoutes = (req) => req.app.locals.apiRoutes || [];

const listRoutes = (req, res) => {
  res.json(new ApiRouteListResponseDto(apiRoutes(req)));
};

const list = asyncHandler(async (req, res) => {
  res.json(new MonitoredEndpointListResponseDto(await monitoringService.list()));
});

const getById = asyncHandler(async (req, res) => {
  res.json(new MonitoredEndpointDetailResponseDto(
    await monitoringService.getById(req.dto.id),
    { isAdmin: req.user.role === ROLES.ADMIN },
  ));
});

const create = asyncHandler(async (req, res) => {
  res.status(201).json(new MonitoredEndpointResponseDto(await monitoringService.create(req.dto, apiRoutes(req))));
});

const remove = asyncHandler(async (req, res) => {
  await monitoringService.remove(req.dto.id);
  res.json(new MessageResponseDto("Endpoint eliminado del monitoreo"));
});

// ---------- Endpoints de /api/monitoring (ver: con sesión; agregar y quitar: administrador) ----------

const router = Router();
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

// GET /api/monitoring/routes (administrador)
router.get("/routes", adminOnly, listRoutes);
// GET /api/monitoring/endpoints (con sesión)
router.get("/endpoints", authenticate, list);
// GET /api/monitoring/endpoints/:id (con sesión)
router.get("/endpoints/:id", authenticate, validateRequest(views.MonitoredEndpointIdRequestDto), getById);
// POST /api/monitoring/endpoints (administrador)
router.post("/endpoints", adminOnly, validateRequest(views.CreateMonitoredEndpointRequestDto), create);
// DELETE /api/monitoring/endpoints/:id (administrador)
router.delete("/endpoints/:id", adminOnly, validateRequest(views.MonitoredEndpointIdRequestDto), remove);

module.exports = { router, listRoutes, list, getById, create, remove };
