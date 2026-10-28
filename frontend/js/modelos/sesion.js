// estado del cliente en localStorage: sesión y tema
import { storage } from "../utilidades.js";

const KEYS = Object.freeze({
  ACCESS_TOKEN: "axon_access_token",
  REFRESH_TOKEN: "axon_refresh_token",
  USER: "axon_user",
  PENDING_EMAIL: "axon_pending_email",
  PENDING_PURPOSE: "axon_pending_purpose",
  CODE_EXPIRES_AT: "axon_code_expires_at",
});

export const VERIFICATION_PURPOSE = Object.freeze({ LOGIN: "login", REGISTRATION: "registration" });

const CODE_VALID_MS = 5 * 60 * 1000; // el código vence a los 5 minutos

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

  updateUser(user) {
    if (user) storage.set(KEYS.USER, JSON.stringify(user));
  },

  clear() {
    storage.remove(KEYS.ACCESS_TOKEN);
    storage.remove(KEYS.REFRESH_TOKEN);
    storage.remove(KEYS.USER);
  },

  setPendingVerification(email, purpose) {
    storage.set(KEYS.PENDING_EMAIL, email);
    storage.set(KEYS.PENDING_PURPOSE, purpose);
    this.restartCodeExpiry();
  },
  restartCodeExpiry() {
    storage.set(KEYS.CODE_EXPIRES_AT, String(Date.now() + CODE_VALID_MS));
  },
  getCodeExpiry() {
    const value = Number(storage.get(KEYS.CODE_EXPIRES_AT));
    return Number.isFinite(value) && value > 0 ? value : Date.now() + CODE_VALID_MS;
  },
  getPendingVerification() {
    return {
      email: storage.get(KEYS.PENDING_EMAIL) || "",
      purpose: storage.get(KEYS.PENDING_PURPOSE) || VERIFICATION_PURPOSE.LOGIN,
    };
  },
  clearPendingVerification() {
    storage.remove(KEYS.PENDING_EMAIL);
    storage.remove(KEYS.PENDING_PURPOSE);
    storage.remove(KEYS.CODE_EXPIRES_AT);
  },
};

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
