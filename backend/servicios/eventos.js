// Tiempo real con Server-Sent Events: registro en memoria de los clientes conectados y envío de eventos.
const crypto = require("crypto");
const { ActivityEventDto, HeartbeatEventDto } = require("../vistas/eventos");

const HEARTBEAT_MS = 15000;

const clients = new Map(); // clientId -> { res, user }
let heartbeatTimer = null;

// Escribe un evento SSE en una conexión; si falla, la descarta.
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

function startHeartbeat() {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    publish("stream:heartbeat", new HeartbeatEventDto({ clients: clients.size, uptimeSeconds: Math.floor(process.uptime()) }));
  }, HEARTBEAT_MS);
  heartbeatTimer.unref();
}

function stopHeartbeat() {
  clearInterval(heartbeatTimer);
  heartbeatTimer = null;
}

// Registra una conexión y devuelve su clientId.
function subscribe(res, user) {
  const clientId = crypto.randomUUID();
  clients.set(clientId, { res, user });
  startHeartbeat();
  return clientId;
}

function unsubscribe(clientId) {
  clients.delete(clientId);
  if (clients.size === 0) stopHeartbeat();
}

const countClients = () => clients.size;

// Cierra todas las conexiones (apagado del servidor).
function closeAll() {
  for (const { res } of clients.values()) {
    try { res.end(); } catch { /* conexión ya cerrada */ }
  }
  clients.clear();
  stopHeartbeat();
}

module.exports = { subscribe, unsubscribe, publish, publishActivity, countClients, closeAll };
