// endpoints /api/simulations y /api/axonApi: solo la lista (método, ruta, filtros y DTO de petición)
const { Router } = require("express");
const { asyncHandler, ROLES } = require("../config/configuracion");
const { authenticate, authorize } = require("../config/autenticacion");
const { validateRequest } = require("../config/validacion");
const { RunSimulationRequestDto } = require("../esquemas/DTOs_Simulacion_Eventos");

// las funciones de cada endpoint están en esquemas/DTOs_Simulacion_Eventos.js
const { run } = require("../esquemas/DTOs_Simulacion_Eventos");

const router = Router();

// POST /api/simulations y /api/axonApi - admin
router.post("/", authenticate, authorize(ROLES.ADMIN), validateRequest(RunSimulationRequestDto), asyncHandler(run));

module.exports = { prefijo: ["/simulations", "/axonApi"], router };
