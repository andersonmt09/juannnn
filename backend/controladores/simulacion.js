// Controlador de /api/simulations: toma la marca de entrada, llama al servicio y responde con la vista.
const { performance } = require("perf_hooks");
const simulationService = require("../servicios/simulacion");
const { asyncHandler } = require("../configuracion");
const { SimulationResponseDto } = require("../vistas/simulacion");

const run = asyncHandler(async (req, res) => {
  const result = await simulationService.run(req.dto, req.receivedAt ?? performance.now());
  res.json(new SimulationResponseDto(result, { path: req.baseUrl }));
});

module.exports = { run };
