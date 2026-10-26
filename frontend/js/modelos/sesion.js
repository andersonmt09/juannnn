// Modelo del estado del cliente, guardado en localStorage:
// la sesión (tokens, usuario actual y verificación pendiente) y las preferencias (tema).
import { storage } from "../utilidades.js";

// ---------- Sesión ----------

const KEYS = Object.freeze({
  ACCESS_TOKEN: "axon_access_token",
  REFRESH_TOKEN: "axon_refresh_token",
  USER: "axon_user",
  PENDING_EMAIL: "axon_pending_email",
  PENDING_PURPOSE: "axon_pending_purpose",
});

export const session = {
  getAccessToken: () => storage.get(KEYS.ACCESS_TOKEN),
  getRefreshToken: () => storage.get(KEYS.REFRESH_TOKEN),

  getUser() {
    try { return JSON.parse(storage.get(KEYS.USER) || "null"); } catch { return null; }
  },

  isLoggedIn() { return Boolean(this.getAccessToken() && this.getUser()); },
  isAdmin() { return this.getUser()?.role === "admin"; },

  save({ accessToken, refreshToken, user }) {
    if (accessToken) storage.set(KEYS.ACCESS_TOKEN, accessToken);
    if (refreshToken) storage.set(KEYS.REFRESH_TOKEN, refreshToken);
    if (user) storage.set(KEYS.USER, JSON.stringify(user));
  },

  clear() {
    storage.remove(KEYS.ACCESS_TOKEN);
    storage.remove(KEYS.REFRESH_TOKEN);
    storage.remove(KEYS.USER);
  },

  // Verificación pendiente: entre el registro o el inicio de sesión y la pantalla del código.
  setPendingVerification(email, purpose) {
    storage.set(KEYS.PENDING_EMAIL, email);
    storage.set(KEYS.PENDING_PURPOSE, purpose);
  },
  getPendingVerification() {
    return {
      email: storage.get(KEYS.PENDING_EMAIL) || "",
      purpose: storage.get(KEYS.PENDING_PURPOSE) || "login",
    };
  },
  clearPendingVerification() {
    storage.remove(KEYS.PENDING_EMAIL);
    storage.remove(KEYS.PENDING_PURPOSE);
  },
};

// ---------- Preferencias ----------

const THEME_KEY = "axon_theme";
const THEMES = ["dark", "light"];

export const preferences = {
  getTheme() {
    const theme = storage.get(THEME_KEY);
    return THEMES.includes(theme) ? theme : "dark";
  },
  setTheme(theme) {
    storage.set(THEME_KEY, theme);
  },
};
