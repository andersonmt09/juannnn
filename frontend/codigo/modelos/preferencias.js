// Modelo de las preferencias del usuario en este navegador (tema claro u oscuro).
import { storage } from "../utilidades/almacenamiento.js";

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
