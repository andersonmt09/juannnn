// Modelo de las preferencias del usuario en este navegador (tema claro u oscuro).
import { STORAGE_KEYS } from "../configuracion/api.js";
import { storage } from "../utilidades/almacenamiento.js";

const THEMES = ["dark", "light"];

export const preferences = {
  getTheme() {
    const theme = storage.get(STORAGE_KEYS.THEME);
    return THEMES.includes(theme) ? theme : "dark";
  },
  setTheme(theme) {
    storage.set(STORAGE_KEYS.THEME, theme);
  },
};
