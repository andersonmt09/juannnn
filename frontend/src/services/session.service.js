/**
 * SERVICIO: Sesión del usuario en el navegador.
 * Guarda y lee tokens y datos del usuario en localStorage.
 */
import { STORAGE_KEYS } from "../config/app.config.js";

const storage = {
  get: (key) => { try { return localStorage.getItem(key); } catch { return null; } },
  set: (key, value) => { try { localStorage.setItem(key, value); } catch { /* sin almacenamiento */ } },
  remove: (key) => { try { localStorage.removeItem(key); } catch { /* sin almacenamiento */ } },
};

export const session = {
  getAccessToken: () => storage.get(STORAGE_KEYS.ACCESS_TOKEN),
  getRefreshToken: () => storage.get(STORAGE_KEYS.REFRESH_TOKEN),

  getUser() {
    try { return JSON.parse(storage.get(STORAGE_KEYS.USER) || "null"); } catch { return null; }
  },

  isLoggedIn() { return Boolean(this.getAccessToken() && this.getUser()); },
  isAdmin() { return this.getUser()?.role === "admin"; },

  save({ accessToken, refreshToken, user }) {
    if (accessToken) storage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) storage.set(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    if (user) storage.set(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  clear() {
    storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
    storage.remove(STORAGE_KEYS.USER);
  },

  // Verificación pendiente (entre login/registro y la pantalla del código)
  setPendingVerification(email, purpose) {
    storage.set(STORAGE_KEYS.PENDING_EMAIL, email);
    storage.set(STORAGE_KEYS.PENDING_PURPOSE, purpose);
  },
  getPendingVerification() {
    return {
      email: storage.get(STORAGE_KEYS.PENDING_EMAIL) || "",
      purpose: storage.get(STORAGE_KEYS.PENDING_PURPOSE) || "login",
    };
  },
  clearPendingVerification() {
    storage.remove(STORAGE_KEYS.PENDING_EMAIL);
    storage.remove(STORAGE_KEYS.PENDING_PURPOSE);
  },

  getTheme: () => storage.get(STORAGE_KEYS.THEME) || "dark",
  setTheme: (theme) => storage.set(STORAGE_KEYS.THEME, theme),
};
