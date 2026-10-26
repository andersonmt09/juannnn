// Modelo del tiempo real: conexión SSE a /api/events/stream (solo administradores) y su estado.
// Los oyentes reciben { name, data, at }. Nombres: stream:connected, stream:heartbeat,
// api:activity, stream:closed (el servidor cerró), stream:status (cambió la conexión)
// y stream:pong (resultado de ping()).
import { session } from "./sesion.js";
import { ensureFreshSession, eventApi, REFRESH } from "./api.js";

const STREAM_URL = "/api/events/stream";
const SERVER_EVENTS = ["stream:connected", "stream:heartbeat", "api:activity"];
const RETRY_MS = 3000;
const MAX_RETRIES = 5;

const STATUS = Object.freeze({ CONNECTED: "CONNECTED", CONNECTING: "CONNECTING", DISCONNECTED: "DISCONNECTED" });

const state = { status: STATUS.DISCONNECTED, count: 0, lastEvent: null, latencyMs: null };
const listeners = new Set();
let source = null;
let retryTimer = null;
let retries = 0;
let wanted = false; // true entre connect() y disconnect()

function emit(name, data) {
  const event = { name, data, at: new Date().toISOString() };
  for (const listener of [...listeners]) {
    try { listener(event); } catch { /* un oyente roto no afecta a los demás */ }
  }
  return event;
}

function setStatus(status) {
  if (state.status === status) return;
  state.status = status;
  emit("stream:status", { ...state });
}

function onServerEvent(name, message) {
  let data = null;
  try { data = JSON.parse(message.data); } catch { /* sin datos */ }
  state.count += 1;
  state.lastEvent = { name, data, at: new Date().toISOString() };
  emit(name, data);
}

function closeSource() {
  source?.close();
  source = null;
}

function scheduleReconnect() {
  if (!wanted || retryTimer || retries >= MAX_RETRIES) return;
  retries += 1;
  retryTimer = setTimeout(async () => {
    retryTimer = null;
    if (!wanted) return;
    const result = await ensureFreshSession(); // el token pudo vencer mientras estaba caído
    if (result === REFRESH.INVALID) { wanted = false; return; } // sesión inválida: no se reabre
    if (wanted) open();
  }, RETRY_MS);
}

// El servidor avisa que cierra el stream (token vencido, tope de conexiones...).
// No se reabre solo: se revisa la sesión y queda desconectado hasta stream.reconnect().
async function onClosedByServer(message) {
  onServerEvent("stream:closed", message);
  closeSource();
  setStatus(STATUS.DISCONNECTED);
  await ensureFreshSession();
}

function open() {
  const token = session.getAccessToken();
  if (!token) { setStatus(STATUS.DISCONNECTED); return; }

  closeSource();
  setStatus(STATUS.CONNECTING);
  source = new EventSource(`${STREAM_URL}?token=${encodeURIComponent(token)}`);

  source.onopen = () => {
    retries = 0;
    setStatus(STATUS.CONNECTED);
  };
  for (const name of SERVER_EVENTS) source.addEventListener(name, (message) => onServerEvent(name, message));
  source.addEventListener("stream:closed", onClosedByServer);

  source.onerror = () => {
    if (!source) return; // ya se cerró a propósito
    setStatus(STATUS.DISCONNECTED);
    // CLOSED: el navegador desistió (p. ej. 401). Se renueva la sesión y se reintenta.
    // CONNECTING: el navegador reintenta solo y onopen devolverá a CONNECTED.
    if (source?.readyState === EventSource.CLOSED) {
      closeSource();
      scheduleReconnect();
    }
  };
}

export const stream = {
  STATUS,

  connect() {
    wanted = true;
    retries = 0;
    if (!source) open();
  },

  // Reconexión manual (botón "Reconectar"): renueva la sesión y abre de nuevo.
  async reconnect() {
    wanted = true;
    retries = 0;
    clearTimeout(retryTimer);
    retryTimer = null;
    closeSource();
    setStatus(STATUS.CONNECTING);
    const result = await ensureFreshSession();
    if (result === REFRESH.INVALID) { wanted = false; setStatus(STATUS.DISCONNECTED); return; }
    if (wanted) open();
  },

  disconnect() {
    wanted = false;
    clearTimeout(retryTimer);
    retryTimer = null;
    closeSource();
    state.count = 0;
    state.lastEvent = null;
    state.latencyMs = null;
    setStatus(STATUS.DISCONNECTED);
  },

  // Devuelve la función para cancelar la suscripción.
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getState: () => ({ ...state }),

  // Mide el tiempo de ida y vuelta (ms) con POST /api/events/ping.
  async ping() {
    const started = performance.now();
    await eventApi.ping();
    state.latencyMs = Math.round(performance.now() - started);
    emit("stream:pong", { latencyMs: state.latencyMs });
    return state.latencyMs;
  },
};
