// Monitoreo de endpoints: el administrador elige rutas reales de la API y el sistema muestra,
// para cada una, cuántas peticiones recibió, cuántas fallaron y su latencia promedio.
const MonitoredEndpoint = require("../modelos/endpoint-monitoreado");
const RequestLog = require("../modelos/registro-peticion");
const { HttpError } = require("../configuracion");

const key = (method, path) => `${method} ${path}`;

async function statsIndex() {
  const stats = await RequestLog.getStatsByRoute();
  return new Map(stats.map((s) => [key(s.method, s.route), s]));
}

// [{ endpoint, stats }]
async function list() {
  const [endpoints, stats] = await Promise.all([MonitoredEndpoint.findAll(), statsIndex()]);
  return endpoints.map((endpoint) => ({ endpoint, stats: stats.get(key(endpoint.method, endpoint.path)) }));
}

// apiRoutes: rutas reales de la API ({ method, path }), para no monitorear rutas que no existen.
async function create(data, apiRoutes) {
  const exists = apiRoutes.some((r) => r.method === data.method && r.path === data.path);
  if (!exists) throw HttpError.badRequest(`La ruta ${data.method} ${data.path} no existe en la API`);

  const all = await MonitoredEndpoint.findAll();
  if (all.some((e) => e.method === data.method && e.path === data.path)) {
    throw HttpError.conflict("Ese endpoint ya se está monitoreando");
  }

  const endpoint = await MonitoredEndpoint.create(data);
  const stats = await statsIndex();
  return { endpoint, stats: stats.get(key(endpoint.method, endpoint.path)) };
}

async function remove(id) {
  const endpoint = await MonitoredEndpoint.findById(id);
  if (!endpoint) throw HttpError.notFound("Endpoint no encontrado");
  await MonitoredEndpoint.delete(id);
}

module.exports = { list, create, remove };
