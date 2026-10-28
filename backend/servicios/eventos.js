// tiempo real con SSE: clientes conectados en memoria
const crypto = require("crypto");
const { ROLES } = require("../configuracion");
const authService = require("./autenticacion");
const { ActivityEventDto, HeartbeatEventDto } = require("../vistas/eventos");

const HEARTBEAT_MS = Number(process.env.SSE_HEARTBEAT_MS) || 15000;
// máximo 3 streams por usuario; el 4.º cierra el más viejo
const MAX_STREAMS_PER_USER = 3;

const clients = new Map();
let heartbeatTimer = null;

function send(clientId, client, eventName, payload) {
  try {
    client.res.write(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`);
  } catch {
    clients.delete(clientId);
  }
}

function publish(eventName, payload) {
  for (const [clientId, client] of [...clients]) send(clientId, client, eventName, payload);
}

function publishActivity(logData) {
  if (clients.size === 0) return;
  publish("api:activity", new ActivityEventDto(logData));
}

function closeClient(clientId, reason) {
  const client = clients.get(clientId);
  if (!client) return;
  send(clientId, client, "stream:closed", { reason });
  clients.delete(clientId);
  try { client.res.end(); } catch { /* conexión ya cerrada */ }
  if (clients.size === 0) stopHeartbeat();
}

async function revalidateClients() {
  for (const [clientId, client] of [...clients]) {
    try {
      const user = await authService.authenticateToken(client.token);
      if (user.role !== ROLES.ADMIN) throw new Error("rol");
      client.user = user;
    } catch (error) {
      // solo se cierra si la sesión ya no es válida
      if (error.message === "rol" || [401, 403].includes(error.statusCode)) closeClient(clientId, "session-invalid");
    }
  }
}

function startHeartbeat() {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(async () => {
    await revalidateClients();
    publish("stream:heartbeat", new HeartbeatEventDto({ clients: clients.size, uptimeSeconds: Math.floor(process.uptime()) }));
  }, HEARTBEAT_MS);
  heartbeatTimer.unref();
}

function stopHeartbeat() {
  clearInterval(heartbeatTimer);
  heartbeatTimer = null;
}

function subscribe(res, user, token) {
  const own = [...clients].filter(([, c]) => c.user.id === user.id);
  if (own.length >= MAX_STREAMS_PER_USER) closeClient(own[0][0], "too-many-streams");

  const clientId = crypto.randomUUID();
  clients.set(clientId, { res, user, token });
  startHeartbeat();
  return clientId;
}

function unsubscribe(clientId) {
  clients.delete(clientId);
  if (clients.size === 0) stopHeartbeat();
}

const countClients = () => clients.size;

function closeAll() {
  for (const { res } of clients.values()) {
    try { res.end(); } catch { /* conexión ya cerrada */ }
  }
  clients.clear();
  stopHeartbeat();
}

module.exports = { subscribe, unsubscribe, publish, publishActivity, countClients, closeAll };
