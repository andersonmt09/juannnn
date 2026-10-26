// Controlador de /api/monitoring: recibe el DTO de petición (req.dto), llama al servicio y responde con su DTO de respuesta.
const monitoringService = require("../servicios/monitoreo");
const asyncHandler = require("../utilidades/manejador-async");
const { MessageResponseDto } = require("../dtos/respuesta/comunes");
const {
  MonitoredEndpointListResponseDto,
  MonitoredEndpointResponseDto,
  ApiRouteListResponseDto,
} = require("../dtos/respuesta/monitoreo");

// Rutas reales de la API; las calcula aplicacion.js al montar las rutas.
const apiRoutes = (req) => req.app.locals.apiRoutes || [];

const listRoutes = (req, res) => {
  res.json(new ApiRouteListResponseDto(apiRoutes(req)));
};

const list = asyncHandler(async (req, res) => {
  res.json(new MonitoredEndpointListResponseDto(await monitoringService.list()));
});

const create = asyncHandler(async (req, res) => {
  res.status(201).json(new MonitoredEndpointResponseDto(await monitoringService.create(req.dto, apiRoutes(req))));
});

const remove = asyncHandler(async (req, res) => {
  await monitoringService.remove(req.dto.id);
  res.json(new MessageResponseDto("Endpoint eliminado del monitoreo"));
});

module.exports = { listRoutes, list, create, remove };
