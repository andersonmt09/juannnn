// simulación de una petición por las cuatro capas
const { performance } = require("perf_hooks");
const { User, MonitoredEndpoint, RequestLog, Simulation } = require("../modelos");
const { HttpError } = require("../config/configuracion");

const round = (ms) => Math.round(ms * 100) / 100;

// cada operación tiene query (modelo) y shape (respuesta)
const OPERATIONS = {
  users: { query: () => User.countByRole(), shape: (roles) => ({ ...roles }) },
  endpoints: {
    query: () => MonitoredEndpoint.findAll(),
    shape: (items) => ({ total: items.length, items: items.map((e) => ({ method: e.method, path: e.path, name: e.name })) }),
  },
  requests: { query: () => RequestLog.getSummary(), shape: (summary) => ({ ...summary }) },
};

// guarda la simulación con la petición registrada (requestLogId) y sus tiempos por capa
function record(summary, requestLogId, viewMs = 0) {
  const { layers } = summary;
  return Simulation.record({
    requestLogId,
    operation: summary.operation,
    forcedError: summary.forcedError,
    totalMs: summary.totalMs,
    layerMs: { vista: viewMs, controlador: layers.api.durationMs, servicio: layers.backend.durationMs, modelo: layers.database.durationMs },
  });
}

async function run({ operation, forceError }, receivedAt = performance.now()) {
  const startedAt = new Date().toISOString();
  const apiEnd = performance.now();

  // backend: validar y preparar
  const prepStart = performance.now();
  const operationDef = Object.hasOwn(OPERATIONS, operation) ? OPERATIONS[operation] : null;
  if (!operationDef) throw HttpError.badRequest("Operación no soportada");
  const prepMs = performance.now() - prepStart;

  // base de datos
  const dbStart = performance.now();
  if (forceError) {
    // el error lleva la simulación para guardarla en runTracked
    const error = new HttpError(500, "Fallo simulado en la capa de base de datos");
    const layers = {
      api: { durationMs: round(apiEnd - receivedAt) },
      backend: { durationMs: round(prepMs) },
      database: { durationMs: round(performance.now() - dbStart) },
    };
    error.simulation = { operation, forcedError: true, totalMs: round(performance.now() - receivedAt), layers };
    throw error;
  }
  const raw = await operationDef.query();
  const databaseMs = performance.now() - dbStart;

  // backend: dar forma a la respuesta
  const shapeStart = performance.now();
  const data = operationDef.shape(raw);
  const backendMs = prepMs + (performance.now() - shapeStart);

  const layers = {
    client: { detail: "Navegador: el frontend completa su tiempo de red", durationMs: 0 },
    api: { detail: "Validación y enrutamiento", durationMs: round(apiEnd - receivedAt) },
    backend: { detail: `Lógica de la operación "${operation}"`, durationMs: round(backendMs) },
    database: { detail: "Consulta a la API de la base de datos", durationMs: round(databaseMs) },
  };
  const totalMs = round(performance.now() - receivedAt);
  return { request: { operation, startedAt }, layers, data, totalMs, simulation: { operation, forcedError: false, totalMs, layers } };
}

// ejecuta, mide la vista y deja la simulación pendiente de guardar (onLogged recibe el callback con el id del registro)
async function runTracked(dto, receivedAt, onLogged, buildView) {
  let result;
  try {
    result = await run(dto, receivedAt ?? performance.now());
  } catch (error) {
    if (error.simulation) onLogged((logId) => record(error.simulation, logId));
    throw error;
  }
  const viewStart = performance.now();
  const view = buildView(result);
  const viewMs = performance.now() - viewStart;
  onLogged((logId) => record(result.simulation, logId, viewMs));
  return view;
}

module.exports = { run, record, runTracked };
