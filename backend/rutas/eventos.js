// Rutas de /api/events (solo administradores): stream en vivo (token en ?token=) y ping.
const { Router } = require("express");
const events = require("../controladores/eventos");
const views = require("../vistas/eventos");
const { authenticate, authenticateFromQuery, authorize } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");
const { ROLES } = require("../configuracion");

const router = Router();

router.get("/stream", authenticateFromQuery, authorize(ROLES.ADMIN), validateRequest(views.StreamRequestDto), events.stream);
router.post("/ping", authenticate, authorize(ROLES.ADMIN), events.ping);

module.exports = router;
