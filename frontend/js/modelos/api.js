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

/** Renueva los tokens con el refresh token. Devuelve true si la sesión quedó vigente. */
export function ensureFreshSession() {
  refreshing ??= (async () => {
    const refreshToken = session.getRefreshToken();
    if (!refreshToken) return false;
    try {
      session.save(await authApi.refreshToken(refreshToken));
      return true;
    } catch {
      return false;
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

  if (response.status === 401 && token && canRetry && (await ensureFreshSession())) {
    return request(method, path, body, false);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token) {
      session.clear();
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
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
};

// ---------- Usuarios: /api/users ----------

export const userApi = {
  // Devuelve { data, meta: { total, page, limit, totalPages } }
  list: (page = 1, limit = 20) => http.get(`/users?page=${page}&limit=${limit}`),
  get: (id) => http.get(`/users/${id}`).then((res) => res.data),
  create: (data) => http.post("/users", data).then((res) => res.data),
  update: (id, data) => http.put(`/users/${id}`, data).then((res) => res.data),
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
};

// ---------- Métricas: /api/metrics ----------

export const metricApi = {
  getDashboard: () => http.get("/metrics/dashboard").then((res) => res.data),
  getServices: () => http.get("/metrics/services").then((res) => res.data),

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
};

// ---------- Eventos en tiempo real: ping (el stream SSE está en eventos.js) ----------

export const eventApi = {
  ping: () => http.post("/events/ping"),
};
