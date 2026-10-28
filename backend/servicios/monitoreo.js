const MonitoredEndpoint = require("../modelos/endpoint-monitoreado");
const RequestLog = require("../modelos/registro-peticion");
const { HttpError } = require("../configuracion");

const key = (method, path) => `${method} ${path}`;

async function statsIndex() {
  const stats = await RequestLog.getStatsByRoute();
  return new Map(stats.map((s) => [key(s.method, s.route), { ...s, errorRate: Math.round(errorRate(s) * 100) / 100 }]));
}

const FAILING_ERROR_RATE = 0.2;

const errorRate = (stats) => (stats?.total ? stats.errors / stats.total : 0);

// no-traffic sin peticiones, failing con 20 % o más de errores, healthy el resto
function endpointStatus(stats) {
  if (!stats || !stats.total) return "no-traffic";
  return errorRate(stats) >= FAILING_ERROR_RATE ? "failing" : "healthy";
}

async function list() {
  const [endpoints, stats] = await Promise.all([MonitoredEndpoint.findAll(), statsIndex()]);
  return endpoints.map((endpoint) => {
    const endpointStats = stats.get(key(endpoint.method, endpoint.path));
    return { endpoint, stats: endpointStats, status: endpointStatus(endpointStats) };
  });
}

async function create(data, apiRoutes) {
  const exists = apiRoutes.some((r) => r.method === data.method && r.path === data.path);
  if (!exists) throw HttpError.badRequest(`La ruta ${data.method} ${data.path} no existe en la API`);

  const all = await MonitoredEndpoint.findAll();
  if (all.some((e) => e.method === data.method && e.path === data.path)) {
    throw HttpError.conflict("Ese endpoint ya se está monitoreando");
  }

  const endpoint = await MonitoredEndpoint.create(data);
  const stats = (await statsIndex()).get(key(endpoint.method, endpoint.path));
  return { endpoint, stats, status: endpointStatus(stats) };
}

async function getById(id) {
  const endpoint = await MonitoredEndpoint.findById(id);
  if (!endpoint) throw HttpError.notFound("Endpoint no encontrado");
  const [index, page] = await Promise.all([
    statsIndex(),
    RequestLog.findPage({ page: 1, limit: 10, method: endpoint.method, route: endpoint.path }),
  ]);
  const stats = index.get(key(endpoint.method, endpoint.path));
  return { endpoint, stats, status: endpointStatus(stats), recentRequests: page.logs };
}

async function remove(id) {
  const endpoint = await MonitoredEndpoint.findById(id);
  if (!endpoint) throw HttpError.notFound("Endpoint no encontrado");
  await MonitoredEndpoint.delete(id);
}

module.exports = { endpointStatus, list, getById, create, remove };
