// Controlador de /api/events: abre el stream SSE y responde el ping.
const eventService = require("../servicios/eventos");
const { ConnectedEventDto, PongResponseDto } = require("../vistas/eventos");
const { Router } = require("express");
const views = require("../vistas/eventos");
const { authenticate, authenticateFromQuery, authorize } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");
const { ROLES } = require("../configuracion");

const stream = (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  res.write("retry: 5000\n\n");

  const clientId = eventService.subscribe(res, req.user, req.dto.token);
  res.write(`event: stream:connected\ndata: ${JSON.stringify(new ConnectedEventDto({ clientId }))}\n\n`);

  req.on("close", () => eventService.unsubscribe(clientId));
};

const ping = (req, res) => {
  res.json(new PongResponseDto());
};

// ---------- Endpoints de /api/events (solo administradores) ----------

const router = Router();

// GET /api/events/stream?token= (administrador; el token va en la query porque EventSource no envía cabeceras)
router.get("/stream", authenticateFromQuery, authorize(ROLES.ADMIN), validateRequest(views.StreamRequestDto), stream);
// POST /api/events/ping (administrador)
router.post("/ping", authenticate, authorize(ROLES.ADMIN), ping);

module.exports = { router, stream, ping };
