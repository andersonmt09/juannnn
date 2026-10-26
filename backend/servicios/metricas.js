// Datos del panel (usuarios, endpoints monitoreados y peticiones) y estado de la base de datos externa.
const User = require("../modelos/usuario");
const MonitoredEndpoint = require("../modelos/endpoint-monitoreado");
const RequestLog = require("../modelos/registro-peticion");
const { db } = require("../externos");
const { ROLES } = require("../configuracion");

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

// ¿Responde la API de la base de datos externa?
async function checkHealth() {
  try {
    await db.ping();
    return { databaseAvailable: true };
  } catch {
    return { databaseAvailable: false };
  }
}

module.exports = { getDashboard, checkHealth };
