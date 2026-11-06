// endpoints /api/simulations y /api/axonApi: cada uno valida con su DTO, llama a rutas/simulacion.js y responde
const { Router } = require("express");
const { asyncHandler, ROLES } = require("../config/configuracion");
const { authenticate, authorize } = require("../config/autenticacion");
const { validateRequest } = require("../config/validacion");
const { RunSimulationRequestDto, SimulationResponseDto } = require("../esquemas/DTOs_Simulacion_Eventos");
const simulationService = require("../rutas/simulacion");

const router = Router();

// POST /api/simulations y /api/axonApi - admin
router.post("/", authenticate, authorize(ROLES.ADMIN), validateRequest(RunSimulationRequestDto), asyncHandler(run));

async function run(req, res) {
  const onLogged = (save) => { res.locals.onLogged = save; };
  res.json(await simulationService.runTracked(req.dto, req.receivedAt, onLogged, (result) => new SimulationResponseDto(result, { path: req.baseUrl })));
}

module.exports = { prefijo: ["/simulations", "/axonApi"], router };
