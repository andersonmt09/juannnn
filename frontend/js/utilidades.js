// Utilidades compartidas por vistas y controladores: crear elementos HTML, íconos,
// notificaciones, exportar a CSV y acceso seguro a localStorage.

// ---------- Elementos HTML ----------

/**
 * Crea un elemento.  el("button", { class: "btn" }, ["Guardar"])
 * Los textos se insertan como texto (no como HTML), evitando XSS.
 */
export function el(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === "class") element.className = value;
    else if (key.startsWith("on") && typeof value === "function") element.addEventListener(key.slice(2), value);
    else element.setAttribute(key, value === true ? "" : value);
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    element.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return element;
}

export function formatDate(value) {
  return value ? new Date(value).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" }) : "—";
}

export function initials(name) {
  return String(name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

// ---------- Íconos ----------

const PATHS = {
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm7-6a3 3 0 1 1 0 6 3 3 0 1 1 0-6zm8 16v-2a3 3 0 0 0-3-3h-1",
  check: "M20 6 9 17l-5-5",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  chart: "M3 3v18h18M7 16l4-8 4 5 4-9",
  bolt: "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
  alert: "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  logo: "M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
};

export function icon(name, className = "") {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("class", `icon ${className}`.trim());
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", PATHS[name] || PATHS.logo);
  svg.append(path);
  return svg;
}

// ---------- Notificaciones ----------

const ICON_BY_TYPE = { success: "check", error: "alert", info: "logo" };

function showToast(message, type = "info") {
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

// ---------- Exportar a CSV ----------

/**
 * @param {object[]} rows      filas a exportar
 * @param {string}   filename  nombre del archivo
 * @param {[string, string][]} columns  pares [campo, encabezado]
 */
export function exportToCsv(rows, filename, columns) {
  const escape = (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const header = columns.map(([, title]) => title).join(",");
  const body = rows.map((row) => columns.map(([field]) => escape(row[field])).join(",")).join("\n");

  const blob = new Blob([`﻿${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast.success(`Exportado: ${filename}`);
}

// ---------- Almacenamiento del navegador ----------
// Si el navegador bloquea localStorage, no rompe la aplicación.
export const storage = {
  get: (key) => { try { return localStorage.getItem(key); } catch { return null; } },
  set: (key, value) => { try { localStorage.setItem(key, value); } catch { /* sin almacenamiento */ } },
  remove: (key) => { try { localStorage.removeItem(key); } catch { /* sin almacenamiento */ } },
};
