// Endpoints de /api/events: solo administradores.
const { Router } = require("express");
const { ROLES } = require("../configuracion");
const { authenticate, authenticateFromQuery, authorize } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");
const { StreamRequestDto, stream, ping } = require("../dto/eventos");

const router = Router();

// GET /api/events/stream?token= — administrador — abre el stream SSE (el token va en la query porque EventSource no envía cabeceras)
router.get("/stream", authenticateFromQuery, authorize(ROLES.ADMIN), validateRequest(StreamRequestDto), stream);
// POST /api/events/ping — administrador — responde pong
router.post("/ping", authenticate, authorize(ROLES.ADMIN), ping);

module.exports = router;
