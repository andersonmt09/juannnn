// simulación de una petición por las cuatro capas
const { performance } = require("perf_hooks");
const User = require("../modelos/usuario");
const MonitoredEndpoint = require("../modelos/endpoint-monitoreado");
const RequestLog = require("../modelos/registro-peticion");
const { HttpError } = require("../configuracion");

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
  if (forceError) throw new HttpError(500, "Fallo simulado en la capa de base de datos");
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
  return { request: { operation, startedAt }, layers, data, totalMs };
}

module.exports = { run };
