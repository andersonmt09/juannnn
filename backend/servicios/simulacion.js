// Simulación de una petición que atraviesa las cuatro capas, midiendo el tiempo de cada una.
const { performance } = require("perf_hooks");
const User = require("../modelos/usuario");
const MonitoredEndpoint = require("../modelos/endpoint-monitoreado");
const RequestLog = require("../modelos/registro-peticion");
const { HttpError } = require("../configuracion");

const round = (ms) => Math.round(ms * 100) / 100;

// Cada operación llama a un modelo distinto y devuelve sus datos.
const OPERATIONS = {
  users: () => User.countByRole(),
  endpoints: async () => {
    const items = await MonitoredEndpoint.findAll();
    return { total: items.length, items: items.map((e) => ({ method: e.method, path: e.path, name: e.name })) };
  },
  requests: () => RequestLog.getSummary(),
};

// receivedAt: performance.now() tomado al entrar la petición (el controlador lo pasa).
async function run({ operation, forceError }, receivedAt = performance.now()) {
  const startedAt = new Date().toISOString();
  const apiEnd = performance.now();

  // Backend: preparación de la lógica
  const backendStart = performance.now();
  const execute = OPERATIONS[operation];
  const backendMs = performance.now() - backendStart;

  // Base de datos: llamada al modelo (o fallo simulado)
  const dbStart = performance.now();
  if (forceError) throw new HttpError(500, "Fallo simulado en la capa de base de datos");
  const data = await execute();
  const databaseMs = performance.now() - dbStart;

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
