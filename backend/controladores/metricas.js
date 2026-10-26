// Controlador de /api/metrics y /api/health: llama al servicio y responde con la vista.
const metricService = require("../servicios/metricas");
const { asyncHandler } = require("../configuracion");
const { DashboardResponseDto, HealthResponseDto } = require("../vistas/metricas");

const getDashboard = asyncHandler(async (req, res) => {
  res.json(new DashboardResponseDto(await metricService.getDashboard()));
});

const checkHealth = asyncHandler(async (req, res) => {
  const status = await metricService.checkHealth();
  res.status(status.databaseAvailable ? 200 : 503).json(new HealthResponseDto(status));
});

module.exports = { getDashboard, checkHealth };
