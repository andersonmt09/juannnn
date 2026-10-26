// Controlador de /api/events: abre el stream SSE y responde el ping.
const eventService = require("../servicios/eventos");
const { ConnectedEventDto, PongResponseDto } = require("../vistas/eventos");

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

module.exports = { stream, ping };
