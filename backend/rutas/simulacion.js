// Ruta de /api/simulations (y su alias /api/axonApi): solo administradores.
const { Router } = require("express");
const simulation = require("../controladores/simulacion");
const views = require("../vistas/simulacion");
const { authenticate, authorize } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");
const { ROLES } = require("../configuracion");

const router = Router();

router.post("/", authenticate, authorize(ROLES.ADMIN), validateRequest(views.RunSimulationRequestDto), simulation.run);

module.exports = router;
