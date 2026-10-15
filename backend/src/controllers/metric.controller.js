/**
 * CONTROLADOR: Métricas  →  /api/metrics
 */
const metricService = require("../services/metric.service");
const asyncHandler = require("../utils/async-handler");

const getDashboard = asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await metricService.getDashboard() });
});

module.exports = { getDashboard };
