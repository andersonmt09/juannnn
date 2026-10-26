// Datos del panel (usuarios, endpoints monitoreados y peticiones) y estado de los servicios.
const User = require("../modelos/usuario");
const MonitoredEndpoint = require("../modelos/endpoint-monitoreado");
const RequestLog = require("../modelos/registro-peticion");
const Database = require("../modelos/base-datos");
const eventService = require("./eventos");
const { env, ROLES, HttpError } = require("../configuracion");

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

  // Errores = peticiones con código >= 400
  const errorsTotal = logs.byStatus
    .filter((item) => Number(item.status) >= 400)
    .reduce((sum, item) => sum + (Number(item.count) || 0), 0);
  const errorRate = logs.total ? Math.round((errorsTotal / logs.total) * 100) / 100 : 0;

  return {
    summary: {
      usersTotal: admins + users, // solo cuentas activas
      usersActive: admins + users,
      usersAdmin: admins,
      usersInactive: inactive,
      monitoredEndpoints: endpoints.length,
      requestsTotal: logs.total,
      requestsLast24h: logs.last24h,
      avgLatencyMs: logs.avgLatencyMs,
      errorsTotal,
      errorRate,
    },
    requestsByStatus: logs.byStatus,
    requestsByMethod: logs.byMethod,
    recentRequests,
  };
}

// Historial de peticiones paginado y filtrado.
async function listRequests({ page, limit, method, statusClass }) {
  const { logs, total } = await RequestLog.findPage({ page, limit, method, statusClass });
  return { logs, total, page, limit };
}

// Una petición registrada y el usuario que la hizo (si hubo).
async function getRequest(id) {
  const log = await RequestLog.findById(id);
  if (!log) throw HttpError.notFound("Petición no encontrada");
  const user = log.userId ? await User.findById(log.userId) : null;
  return { log, user };
}

// ¿Responde la API de la base de datos externa?
async function checkHealth() {
  const { available, latencyMs } = await Database.ping();
  return {
    databaseAvailable: available,
    databaseLatencyMs: latencyMs,
    uptimeSeconds: Math.round(process.uptime()),
  };
}

// Estado de cada servicio: base de datos, API, tiempo real y correo.
async function getServices() {
  const { available, latencyMs } = await Database.ping();
  const clients = eventService.countClients();

  return [
    {
      key: "database",
      name: "Base de datos",
      role: "API externa de datos",
      status: available ? "online" : "offline",
      detail: available ? `Responde en ${latencyMs} ms` : "No responde",
    },
    {
      key: "api",
      name: "Express",
      role: "API REST",
      status: "online",
      detail: `Node ${process.version} · activo ${Math.round(process.uptime())} s`,
    },
    {
      key: "realtime",
      name: "Tiempo real",
      role: "Server-Sent Events",
      status: "online",
      detail: `${clients} ${clients === 1 ? "cliente conectado" : "clientes conectados"}`,
    },
    {
      key: "mail",
      name: "Correo",
      role: "Códigos de verificación",
      status: env.smtp.host ? "online" : "console",
      detail: env.smtp.host ? `SMTP ${env.smtp.host}` : "Sin SMTP: los códigos salen por la consola",
    },
  ];
}

module.exports = { getDashboard, listRequests, getRequest, checkHealth, getServices };
