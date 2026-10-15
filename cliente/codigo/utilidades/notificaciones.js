// Notificaciones emergentes.
import { icon } from "./iconos.js";

const ICON_BY_TYPE = { success: "check", error: "alert", info: "logo" };

export function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.append(icon(ICON_BY_TYPE[type], "toast-icon"));
  const text = document.createElement("span");
  text.textContent = message;
  toast.append(text);
  container.append(toast);

  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => toast.remove(), 260);
  }, 3400);
}

export const toast = {
  success: (message) => showToast(message, "success"),
  error: (message) => showToast(message, "error"),
  info: (message) => showToast(message, "info"),
};
