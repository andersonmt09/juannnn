// Modelo de datos remoto: todas las llamadas al backend (/api).
// El cliente agrega el token, lo renueva una vez si expira y, si la sesión ya no es válida,
// avisa con el evento SESSION_EXPIRED_EVENT (lo atiende controladores/menu.js).
import { session } from "./sesion.js";

// ---------- Cliente HTTP ----------

const API_BASE_URL = "/api"; // el backend sirve el frontend: misma dirección

export const SESSION_EXPIRED_EVENT = "session:expired";

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// Una sola renovación a la vez: si llegan varios 401 juntos, todos esperan la misma promesa.
let refreshing = null;

// Resultado de la renovación: vigente, inválida (401/403) o sin respuesta (red caída o 503).
export const REFRESH = Object.freeze({ OK: "ok", INVALID: "invalid", UNAVAILABLE: "unavailable" });

function expireSession() {
  session.clear();
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

/**
 * Renueva los tokens con el refresh token. Solo se cierra la sesión (y se avisa una vez)
 * si el servidor responde 401/403; por red o 503 la sesión se conserva.
 */
export function ensureFreshSession() {
  refreshing ??= (async () => {
    const refreshToken = session.getRefreshToken();
    if (!refreshToken) {
      if (session.getAccessToken()) expireSession();
      return REFRESH.INVALID;
    }
    try {
      session.save(await authApi.refreshToken(refreshToken));
      return REFRESH.OK;
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        expireSession();
        return REFRESH.INVALID;
      }
      return REFRESH.UNAVAILABLE;
    }
  })().finally(() => { refreshing = null; });
  return refreshing;
}

async function request(method, path, body, canRetry = true) {
  const headers = { "Content-Type": "application/json" };
  const token = session.getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("No se pudo conectar con la API", 0);
  }

  if (response.status === 401 && token && canRetry) {
    // Si otra petición ya renovó el token, solo se reintenta con el nuevo.
    const current = session.getAccessToken();
    if (current && current !== token) return request(method, path, body, false);
    const result = await ensureFreshSession();
    if (result === REFRESH.OK) return request(method, path, body, false);
    if (result === REFRESH.UNAVAILABLE) throw new ApiError("No se pudo renovar la sesión, intenta de nuevo", 503);
    throw new ApiError("Tu sesión expiró", 401); // INVALID: el aviso ya se emitió una sola vez
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.message || "Error en la solicitud", response.status, data);
  }
  return data;
}

const http = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),
};

// ---------- Autenticación: /api/auth ----------

export const authApi = {
  // fetch directo (sin pasar por request) para no entrar en un ciclo de renovaciones.
  async refreshToken(refreshToken) {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      throw new ApiError("No se pudo conectar con la API", 0);
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(data?.message || "No se pudo renovar la sesión", response.status, data);
    return data;
  },

  register: (data) => http.post("/auth/register", data),
  verifyRegistration: (email, code) => http.post("/auth/register/verify", { email, code }),
  resendRegistrationCode: (email) => http.post("/auth/register/resend-code", { email }),

  login: (email, password) => http.post("/auth/login", { email, password }),
  verifyLogin: (email, code) => http.post("/auth/login/verify", { email, code }),
  resendLoginCode: (email) => http.post("/auth/login/resend-code", { email }),

  // Recuperar contraseña: el correo siempre recibe la misma respuesta genérica.
  forgotPassword: (email) => http.post("/auth/password/forgot", { email }),
  resetPassword: (email, code, password) => http.post("/auth/password/reset", { email, code, password }),
};

// ---------- Usuarios: /api/users ----------

export const userApi = {
  // Devuelve { data, meta: { total, page, limit, totalPages } }
  list: (page = 1, limit = 20) => http.get(`/users?page=${page}&limit=${limit}`),
  get: (id) => http.get(`/users/${id}`).then((res) => res.data),
  create: (data) => http.post("/users", data).then((res) => res.data),
  update: (id, data) => http.put(`/users/${id}`, data).then((res) => res.data),
  // Si es la contraseña propia, la respuesta trae una sesión nueva { accessToken, refreshToken, user }.
  changePassword: (id, password, currentPassword) => http.patch(`/users/${id}/password`, { password, currentPassword }),
  remove: (id) => http.delete(`/users/${id}`),

  // Todos los usuarios (recorre todas las páginas), para exportar a CSV.
  async listAll() {
    const all = [];
    for (let page = 1, totalPages = 1; page <= totalPages; page++) {
      const { data, meta } = await http.get(`/users?page=${page}&limit=100`);
      all.push(...data);
      totalPages = meta.totalPages;
    }
    return all;
  },
};

// ---------- Monitoreo: /api/monitoring ----------

export const monitoringApi = {
  listEndpoints: () => http.get("/monitoring/endpoints").then((res) => res.data),
  listApiRoutes: () => http.get("/monitoring/routes").then((res) => res.data),
  addEndpoint: (data) => http.post("/monitoring/endpoints", data).then((res) => res.data),
  removeEndpoint: (id) => http.delete(`/monitoring/endpoints/${id}`),
  // Detalle: el endpoint con sus estadísticas y recentRequests (hasta 10).
  getEndpoint: (id) => http.get(`/monitoring/endpoints/${id}`).then((res) => res.data),
};

// ---------- Métricas: /api/metrics ----------

export const metricApi = {
  getDashboard: () => http.get("/metrics/dashboard").then((res) => res.data),
  getServices: () => http.get("/metrics/services").then((res) => res.data),
  // Detalle de una petición registrada, con el usuario que la hizo (o null).
  getRequest: (id) => http.get(`/metrics/requests/${id}`).then((res) => res.data),

  // Historial paginado. Devuelve { data, meta: { total, page, limit, totalPages } }
  listRequests({ page = 1, limit = 20, method, statusClass } = {}) {
    const query = new URLSearchParams({ page, limit });
    if (method) query.set("method", method);
    if (statusClass) query.set("statusClass", statusClass);
    return http.get(`/metrics/requests?${query}`);
  },
};

// ---------- Sistema: /api/health ----------

export const systemApi = {
  // Con la BD caída el backend responde 503 pero con cuerpo útil: se devuelve igual.
  async getHealth() {
    try {
      return await http.get("/health");
    } catch (error) {
      if (error.data?.status) return error.data;
      throw error;
    }
  },
};

// ---------- Simulación: /api/simulations (alias del documento: /api/axonApi) ----------

export const simulationApi = {
  // Devuelve { request, layers, data, totalMs }
  run: ({ operation = "users", forceError = false } = {}) => http.post("/simulations", { operation, forceError }),

  // Medición (no regla de negocio): la capa Cliente es el tiempo total menos el del servidor.
  withClientLayer(result, totalMs) {
    const layers = result.layers.map((layer) => ({ ...layer }));
    layers[0].durationMs = Math.max(0, totalMs - result.totalMs);
    return { ...result, layers, totalMs };
  },
};

// ---------- Eventos en tiempo real: ping (el stream SSE está en eventos.js) ----------

export const eventApi = {
  ping: () => http.post("/events/ping"),
};
