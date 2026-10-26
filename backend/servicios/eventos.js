// Tiempo real con Server-Sent Events: registro en memoria de los clientes conectados y envío de eventos.
const crypto = require("crypto");
const { ROLES } = require("../configuracion");
const authService = require("./autenticacion");
const { ActivityEventDto, HeartbeatEventDto } = require("../vistas/eventos");

// El intervalo se puede bajar con SSE_HEARTBEAT_MS (útil en pruebas).
const HEARTBEAT_MS = Number(process.env.SSE_HEARTBEAT_MS) || 15000;
// Decisión: máximo 3 streams por usuario; el 4.º cierra el más viejo (así una pestaña
// olvidada nunca deja fuera al usuario).
const MAX_STREAMS_PER_USER = 3;

const clients = new Map(); // clientId -> { res, user, token }
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

// Avisa y cierra una conexión (sesión inválida, tope de streams...).
function closeClient(clientId, reason) {
  const client = clients.get(clientId);
  if (!client) return;
  send(clientId, client, "stream:closed", { reason });
  clients.delete(clientId);
  try { client.res.end(); } catch { /* conexión ya cerrada */ }
  if (clients.size === 0) stopHeartbeat();
}

// Revalida el token de cada cliente (expiración, token_version, usuario activo y rol admin).
async function revalidateClients() {
  for (const [clientId, client] of [...clients]) {
    try {
      const user = await authService.authenticateToken(client.token);
      if (user.role !== ROLES.ADMIN) throw new Error("rol");
      client.user = user;
    } catch (error) {
      // Solo se cierra si la sesión ya no es válida; un fallo pasajero de la BD no corta el stream.
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

// Registra una conexión y devuelve su clientId.
function subscribe(res, user, token) {
  // Tope por usuario: se cierra el stream más antiguo (el Map conserva el orden de inserción).
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

// Cierra todas las conexiones (apagado del servidor).
function closeAll() {
  for (const { res } of clients.values()) {
    try { res.end(); } catch { /* conexión ya cerrada */ }
  }
  clients.clear();
  stopHeartbeat();
}

module.exports = { subscribe, unsubscribe, publish, publishActivity, countClients, closeAll };
