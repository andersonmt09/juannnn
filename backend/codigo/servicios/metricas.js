// Datos del panel: usuarios, endpoints monitoreados y estadísticas de peticiones.
const User = require("../modelos/usuario");
const MonitoredEndpoint = require("../modelos/endpoint-monitoreado");
const RequestLog = require("../modelos/registro-peticion");
const { ROLES } = require("../constantes/roles");

async function getDashboard() {
  const [roles, endpoints, logs, recentRequests] = await Promise.all([
    User.countByRole(),
    MonitoredEndpoint.findAll(),
    RequestLog.getSummary(),
    RequestLog.findRecent(10),
  ]);

  const admins = roles[ROLES.ADMIN] || 0;
  const users = roles[ROLES.USER] || 0;
  const inactive = roles[ROLES.INACTIVE] || 0;

  return {
    summary: {
      usersTotal: admins + users + inactive,
      usersActive: admins + users,
      usersAdmin: admins,
      usersInactive: inactive,
      monitoredEndpoints: endpoints.length,
      requestsTotal: logs.total,
      requestsLast24h: logs.last24h,
      avgLatencyMs: logs.avgLatencyMs,
    },
    requestsByStatus: logs.byStatus,
    requestsByMethod: logs.byMethod,
    recentRequests,
  };
}

module.exports = { getDashboard };
