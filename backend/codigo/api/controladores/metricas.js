// Controlador de /api/metrics.
const metricService = require("../../casos-de-uso/metricas");
const asyncHandler = require("../../utilidades/manejador-async");

const getDashboard = asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await metricService.getDashboard() });
});

module.exports = { getDashboard };
