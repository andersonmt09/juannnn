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

// Rutas reales de la API; las calcula servidor.js con listApiRoutes de rutas/index.js.
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

module.exports = { listRoutes, list, getById, create, remove };
