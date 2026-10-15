/** Utilidades para construir HTML de forma segura. */

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

/** Escapa texto para usarlo dentro de plantillas HTML. */
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "—";
}

export function initials(name) {
  return String(name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
