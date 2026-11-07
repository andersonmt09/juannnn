// DTO de la simulación y de la actividad en vivo
const { BaseRequestDto } = require("./DTOs_Comunes");

// ---------- Petición (validan y limpian lo que llega)

const OPERATIONS = ["users", "endpoints", "requests"];

class RunSimulationRequestDto extends BaseRequestDto {
  constructor({ operation = "users", forceError = false } = {}) {
    super();
    this.operation = String(operation).trim().toLowerCase();
    this.forceError = forceError === true || forceError === "true";
  }
  validate() {
    return OPERATIONS.includes(this.operation) ? [] : [`La operación debe ser una de: ${OPERATIONS.join(", ")}`];
  }
}

class StreamRequestDto extends BaseRequestDto {
  constructor({ token } = {}) {
    super();
    this.token = String(token || "").trim();
  }
  validate() {
    return this.token ? [] : ["El token es obligatorio"];
  }
}

// ---------- Respuesta (lo que se devuelve)

const LAYER_NAMES = {
  client: "Cliente / UI",
  api: "Capa API",
  backend: "Backend / Lógica",
  database: "Base de datos",
};

class SimulationResponseDto {
  constructor({ request, layers, data, totalMs }, { path = "/api/simulations" } = {}) {
    this.ok = true;
    this.request = {
      method: "POST",
      path,
      operation: request.operation,
      startedAt: request.startedAt,
    };
    this.layers = Object.keys(LAYER_NAMES).map((key, index) => ({
      order: index + 1,
      key,
      name: LAYER_NAMES[key],
      detail: layers[key].detail,
      durationMs: layers[key].durationMs,
    }));
    this.data = data;
    this.totalMs = totalMs;
  }
}

class ConnectedEventDto {
  constructor({ clientId }) {
    this.clientId = clientId;
    this.serverTime = new Date().toISOString();
  }
}

class HeartbeatEventDto {
  constructor({ clients, uptimeSeconds }) {
    this.serverTime = new Date().toISOString();
    this.uptimeSeconds = uptimeSeconds;
    this.clients = clients;
  }
}

class ActivityEventDto {
  constructor(log) {
    this.id = log.id ?? null;
    this.method = log.method;
    this.path = log.path;
    this.statusCode = log.statusCode;
    this.latencyMs = log.latencyMs;
    this.createdAt = log.createdAt || new Date().toISOString();
  }
}

class PongResponseDto {
  constructor() {
    this.ok = true;
    this.event = "stream:pong";
    this.serverTime = new Date().toISOString();
  }
}

// se exportan antes de cargar rutas/: las rutas también usan estos DTO
module.exports = {
  RunSimulationRequestDto,
  OPERATIONS,
  StreamRequestDto,
  SimulationResponseDto,
  ConnectedEventDto,
  HeartbeatEventDto,
  ActivityEventDto,
  PongResponseDto,
};

// ---------- Funciones de los endpoints (reciben req, llaman a rutas/ y responden con un DTO)

const simulationService = require("../rutas/simulacion");
const eventService = require("../rutas/eventos");

// simulacion
async function run(req, res) {
  const onLogged = (save) => { res.locals.onLogged = save; };
  res.json(await simulationService.runTracked(req.dto, req.receivedAt, onLogged, (result) => new SimulationResponseDto(result, { path: req.baseUrl })));
}

// eventos
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

Object.assign(module.exports, {
  run,
  stream,
  ping,
});
