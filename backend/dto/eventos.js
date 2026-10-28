// DTO de petición (req) de /api/events: lo que envía el cliente, limpio y validado.
const { BaseRequestDto } = require("./comunes");
const eventService = require("../servicios/eventos");
const { ConnectedEventDto, PongResponseDto } = require("../vistas/eventos");

// GET /api/events/stream?token=
class StreamRequestDto extends BaseRequestDto {
  constructor({ token } = {}) {
    super();
    this.token = String(token || "").trim();
  }
  validate() {
    return this.token ? [] : ["El token es obligatorio"];
  }
}

// ---------- Funciones que reciben la petición (req) ----------

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

module.exports = { StreamRequestDto, stream, ping };
