// Controlador de /api/simulations: toma la marca de entrada, llama al servicio y responde con la vista.
const { performance } = require("perf_hooks");
const simulationService = require("../servicios/simulacion");
const { asyncHandler } = require("../configuracion");
const { SimulationResponseDto } = require("../vistas/simulacion");
const { Router } = require("express");
const views = require("../vistas/simulacion");
const { authenticate, authorize } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");
const { ROLES } = require("../configuracion");

const run = asyncHandler(async (req, res) => {
  const result = await simulationService.run(req.dto, req.receivedAt ?? performance.now());
  res.json(new SimulationResponseDto(result, { path: req.baseUrl }));
});

// ---------- Endpoint de /api/simulations (y su alias /api/axonApi): solo administradores ----------

const router = Router();

// POST /api/simulations y /api/axonApi (administrador)
router.post("/", authenticate, authorize(ROLES.ADMIN), validateRequest(views.RunSimulationRequestDto), run);

module.exports = { router, run };
