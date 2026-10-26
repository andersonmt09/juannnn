// Controlador de /api/metrics y /api/health: llama al servicio y responde con la vista.
const metricService = require("../servicios/metricas");
const { asyncHandler } = require("../configuracion");
const { DashboardResponseDto, HealthResponseDto, RequestLogListResponseDto, ServiceListResponseDto } = require("../vistas/metricas");

const getDashboard = asyncHandler(async (req, res) => {
  res.json(new DashboardResponseDto(await metricService.getDashboard()));
});

const listRequests = asyncHandler(async (req, res) => {
  res.json(new RequestLogListResponseDto(await metricService.listRequests(req.dto)));
});

const getServices = asyncHandler(async (req, res) => {
  res.json(new ServiceListResponseDto(await metricService.getServices()));
});

const checkHealth = asyncHandler(async (req, res) => {
  const status = await metricService.checkHealth();
  res.status(status.databaseAvailable ? 200 : 503).json(new HealthResponseDto(status));
});

module.exports = { getDashboard, listRequests, getServices, checkHealth };
