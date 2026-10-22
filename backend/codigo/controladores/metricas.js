// Controlador de /api/metrics: llama al servicio y responde con DashboardResponseDto.
const metricService = require("../servicios/metricas");
const asyncHandler = require("../utilidades/manejador-async");
const { DashboardResponseDto } = require("../dtos/respuesta/metricas");

const getDashboard = asyncHandler(async (req, res) => {
  res.json(new DashboardResponseDto(await metricService.getDashboard()));
});

module.exports = { getDashboard };
