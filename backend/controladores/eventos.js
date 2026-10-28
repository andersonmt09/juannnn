// Controlador de /api/events: abre el stream SSE y responde el ping.
const { Router } = require("express");
const eventService = require("../servicios/eventos");
const { ROLES } = require("../configuracion");
const { authenticate, authenticateFromQuery, authorize } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");
// DTO de petición (req): lo que envía el cliente
const { StreamRequestDto } = require("../dto/eventos");
// Vistas (res): lo que responde el servidor
const { ConnectedEventDto, PongResponseDto } = require("../vistas/eventos");

// ---------- Endpoints ----------
// /api/events: solo administradores.

const router = Router();

// GET /api/events/stream?token= (administrador; el token va en la query porque EventSource no envía cabeceras)
router.get("/stream", authenticateFromQuery, authorize(ROLES.ADMIN), validateRequest(StreamRequestDto), stream);
// POST /api/events/ping (administrador)
router.post("/ping", authenticate, authorize(ROLES.ADMIN), ping);

// ---------- Funciones del controlador ----------

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

module.exports = { router, stream, ping };
