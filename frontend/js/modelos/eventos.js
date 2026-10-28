// conexión SSE a /api/events/stream (solo administradores)
import { session } from "./sesion.js";
import { StreamRequestDto } from "../dto/eventos.js";
import { ensureFreshSession, REFRESH } from "./api.js";

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
    const result = await ensureFreshSession();
    if (result === REFRESH.INVALID) { wanted = false; return; }
    if (wanted) open();
  }, RETRY_MS);
}

// el servidor cerró el stream: no se reabre solo
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
  source = new EventSource(`${STREAM_URL}${new StreamRequestDto({ token }).toQuery()}`);

  source.onopen = () => {
    retries = 0;
    setStatus(STATUS.CONNECTED);
  };
  for (const name of SERVER_EVENTS) source.addEventListener(name, (message) => onServerEvent(name, message));
  source.addEventListener("stream:closed", onClosedByServer);

  source.onerror = () => {
    if (!source) return;
    setStatus(STATUS.DISCONNECTED);
    // CLOSED: el navegador desistió (p. ej. 401), se renueva la sesión
    // CONNECTING: el navegador reintenta solo
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

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getState: () => ({ ...state }),

  async ping(sendPing) {
    const started = performance.now();
    await sendPing();
    state.latencyMs = Math.round(performance.now() - started);
    emit("stream:pong", { latencyMs: state.latencyMs });
    return state.latencyMs;
  },
};
