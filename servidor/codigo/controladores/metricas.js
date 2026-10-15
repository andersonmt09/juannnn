// Controlador de /api/metrics.
const metricService = require("../servicios/metricas");
const asyncHandler = require("../utilidades/manejador-async");

const getDashboard = asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await metricService.getDashboard() });
});

module.exports = { getDashboard };
