// Controlador de acciones generales de la sesión: cerrar sesión y cambiar el tema.
import { session } from "../modelos/sesion.js";
import { preferences } from "../modelos/preferencias.js";

export function applySavedTheme() {
  document.documentElement.dataset.theme = preferences.getTheme();
}

// Alterna entre claro y oscuro y devuelve el tema nuevo.
export function toggleTheme() {
  const next = preferences.getTheme() === "light" ? "dark" : "light";
  preferences.setTheme(next);
  document.documentElement.dataset.theme = next;
  return next;
}

export function logout() {
  session.clear();
  location.hash = "#/login";
}
