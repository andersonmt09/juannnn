// Simulación de una petición que atraviesa las cuatro capas, midiendo el tiempo de cada una.
const { performance } = require("perf_hooks");
const User = require("../modelos/usuario");
const MonitoredEndpoint = require("../modelos/endpoint-monitoreado");
const RequestLog = require("../modelos/registro-peticion");
const { HttpError } = require("../configuracion");

const round = (ms) => Math.round(ms * 100) / 100;

// Cada operación tiene dos partes: query (llama a un modelo) y shape (da forma a la respuesta).
// La capa Backend mide la validación/preparación y el shape; la llamada al modelo cuenta como BD.
const OPERATIONS = {
  users: { query: () => User.countByRole(), shape: (roles) => ({ ...roles }) },
  endpoints: {
    query: () => MonitoredEndpoint.findAll(),
    shape: (items) => ({ total: items.length, items: items.map((e) => ({ method: e.method, path: e.path, name: e.name })) }),
  },
  requests: { query: () => RequestLog.getSummary(), shape: (summary) => ({ ...summary }) },
};

// receivedAt: performance.now() tomado al entrar la petición (el controlador lo pasa).
async function run({ operation, forceError }, receivedAt = performance.now()) {
  const startedAt = new Date().toISOString();
  const apiEnd = performance.now();

  // Backend: validar la operación y preparar la consulta (antes de la BD)
  const prepStart = performance.now();
  const operationDef = Object.hasOwn(OPERATIONS, operation) ? OPERATIONS[operation] : null;
  if (!operationDef) throw HttpError.badRequest("Operación no soportada");
  const prepMs = performance.now() - prepStart;

  // Base de datos: llamada al modelo (o fallo simulado)
  const dbStart = performance.now();
  if (forceError) throw new HttpError(500, "Fallo simulado en la capa de base de datos");
  const raw = await operationDef.query();
  const databaseMs = performance.now() - dbStart;

  // Backend: dar forma a la respuesta con el resultado de la BD
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
