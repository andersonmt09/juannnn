// endpoints /api/events: cada uno valida con su DTO, llama a rutas/eventos.js y responde
const { Router } = require("express");
const { ROLES } = require("../config/configuracion");
const { authenticate, authenticateFromQuery, authorize } = require("../config/autenticacion");
const { validateRequest } = require("../config/validacion");
const { StreamRequestDto, ConnectedEventDto, PongResponseDto } = require("../esquemas/DTOs_Simulacion_Eventos");
const eventService = require("../rutas/eventos");

const router = Router();

// GET /api/events/stream?token= - admin
router.get("/stream", authenticateFromQuery, authorize(ROLES.ADMIN), validateRequest(StreamRequestDto), stream);
// POST /api/events/ping - admin
router.post("/ping", authenticate, authorize(ROLES.ADMIN), ping);

function stream(req, res) {
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
}

function ping(req, res) {
  res.json(new PongResponseDto());
}

module.exports = { prefijo: "/events", router };
