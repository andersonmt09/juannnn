// Controlador de /api/simulations: toma la marca de entrada, llama al servicio y responde con la vista.
const { performance } = require("perf_hooks");
const { Router } = require("express");
const simulationService = require("../servicios/simulacion");
const { asyncHandler, ROLES } = require("../configuracion");
const { authenticate, authorize } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");
// DTO de petición (req): lo que envía el cliente
const { RunSimulationRequestDto } = require("../dto/simulacion");
// Vistas (res): lo que responde el servidor
const { SimulationResponseDto } = require("../vistas/simulacion");

// ---------- Endpoints ----------
// /api/simulations (y su alias /api/axonApi): solo administradores.

const router = Router();

// POST /api/simulations y /api/axonApi (administrador)
router.post("/", authenticate, authorize(ROLES.ADMIN), validateRequest(RunSimulationRequestDto), asyncHandler(run));

// ---------- Funciones del controlador ----------

async function run(req, res) {
  const result = await simulationService.run(req.dto, req.receivedAt ?? performance.now());
  res.json(new SimulationResponseDto(result, { path: req.baseUrl }));
}

module.exports = { router, run };
