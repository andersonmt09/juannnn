// Datos del dashboard: usuarios, endpoints y estadísticas de peticiones.
const User = require("../modelos/usuario");
const Endpoint = require("../modelos/endpoint");
const RequestLog = require("../modelos/registro-peticion");
const { ROLES } = require("../constantes/roles");

async function getDashboard() {
  const [roles, endpointCount, logs, recentLogs] = await Promise.all([
    User.countByRole(),
    Endpoint.count(),
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
      endpoints: endpointCount,
      requestsTotal: logs.total,
      requestsLast24h: logs.last24h,
      avgLatencyMs: logs.avgLatencyMs,
    },
    requestsByStatus: logs.byStatus,
    requestsByMethod: logs.byMethod,
    recentRequests: recentLogs,
  };
}

module.exports = { getDashboard };
