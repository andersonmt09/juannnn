// Endpoints de /api/simulations (y su alias /api/axonApi): solo administradores.
const { Router } = require("express");
const { asyncHandler, ROLES } = require("../configuracion");
const { authenticate, authorize } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");
const { RunSimulationRequestDto, run } = require("../dto/simulacion");

const router = Router();

// POST /api/simulations y /api/axonApi — administrador — ejecuta la simulación por capas
router.post("/", authenticate, authorize(ROLES.ADMIN), validateRequest(RunSimulationRequestDto), asyncHandler(run));

module.exports = router;
