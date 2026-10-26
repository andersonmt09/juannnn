// Modelo de datos remoto: todas las llamadas al backend (/api).
// El cliente agrega el token, lo renueva una vez si expira y, si la sesión ya no es válida,
// avisa con el evento SESSION_EXPIRED_EVENT (lo atiende principal.js).
import { session } from "./sesion.js";

// ---------- Cliente HTTP ----------

const API_BASE_URL = "/api"; // el backend sirve el frontend: misma dirección

export const SESSION_EXPIRED_EVENT = "session:expired";

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function refreshSession() {
  const refreshToken = session.getRefreshToken();
  if (!refreshToken) return false;
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return false;
    session.save(await response.json());
    return true;
  } catch {
    return false;
  }
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

  if (response.status === 401 && token && canRetry && (await refreshSession())) {
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
};
