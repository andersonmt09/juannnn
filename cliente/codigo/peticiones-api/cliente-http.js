// Cliente HTTP hacia la API. Agrega el token y lo renueva una vez si expira.
import { APP_CONFIG } from "../configuracion/api.js";
import { session } from "../estado/sesion.js";

export class ApiError extends Error {
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
    const response = await fetch(`${APP_CONFIG.API_BASE_URL}/auth/refresh-token`, {
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
    response = await fetch(`${APP_CONFIG.API_BASE_URL}${path}`, {
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
      location.hash = "#/login";
    }
    throw new ApiError(data?.message || "Error en la solicitud", response.status, data);
  }
  return data;
}

export const http = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),
};
