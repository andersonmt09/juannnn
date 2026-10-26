// Catálogo de piezas visuales reutilizables (sistema de diseño "sala de control").
// Solo dibujan: no llaman a la API ni deciden acciones; los eventos salen por callbacks.
import { el, initials, icon, formatNumber, formatDate } from "../utilidades.js";


// ---------- Encabezado ----------

/** pageHeader({ title, subtitle, actions }) */
export function pageHeader({ title, subtitle, actions = [] }) {
  return el("div", { class: "page-header" }, [
    el("div", { class: "page-heading" }, [
      el("h1", {}, [title]),
      subtitle ? el("p", { class: "page-subtitle" }, [subtitle]) : null,
    ]),
    actions.length ? el("div", { class: "page-actions" }, actions) : null,
  ]);
}

// ---------- Estados: vacío, error y esqueleto ----------

// action: un nodo (botón) o { label, onClick, icon }.
function actionButton(action) {
  if (!action || action instanceof Node) return action || null;
  return el("button", { type: "button", class: "btn btn-primary", onclick: action.onClick }, [
    action.icon ? icon(action.icon) : null, action.label,
  ]);
}

/** emptyState({ icon, title, text, action }) */
export function emptyState({ icon: iconName = "layers", title, text, action }) {
  return el("div", { class: "empty" }, [
    el("div", { class: "empty-icon" }, [icon(iconName)]),
    el("h3", { class: "empty-title" }, [title]),
    text ? el("p", { class: "empty-text" }, [text]) : null,
    actionButton(action),
  ]);
}

/** errorState({ text, onRetry }) */
export function errorState({ text = "No se pudo cargar la información.", onRetry } = {}) {
  return el("div", { class: "empty", "data-tone": "danger", role: "alert" }, [
    el("div", { class: "empty-icon" }, [icon("alert")]),
    el("h3", { class: "empty-title" }, ["Algo salió mal"]),
    el("p", { class: "empty-text" }, [text]),
    onRetry ? el("button", { type: "button", class: "btn btn-secondary", onclick: onRetry }, [icon("refresh"), "Reintentar"]) : null,
  ]);
}

/** skeleton(lines) */
export function skeleton(lines = 3) {
  return el("div", { class: "skeleton", "aria-hidden": "true" },
    Array.from({ length: lines }, (_, i) => el("div", { class: `skeleton-line${i === lines - 1 ? " is-short" : ""}` })));
}

// ---------- Ventana modal y confirmación ----------

const FOCUSABLE = "input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled])";

/**
 * createModal({ title, body, footer, onClose }) -> { element, open, close, setTitle }
 * footer: nodo o lista de nodos (botones). Se cierra con Esc o tocando el fondo.
 */
export function createModal({ title, body, footer, onClose }) {
  const titleId = `modal-title-${Math.random().toString(36).slice(2, 8)}`;
  const heading = el("h2", { id: titleId, class: "modal-title" }, [title]);
  const footerNodes = footer ? [].concat(footer) : [];

  const element = el("div", { class: "modal hidden" }, [
    el("div", { class: "modal-backdrop", onclick: () => close() }),
    el("div", { class: "modal-card", role: "dialog", "aria-modal": "true", "aria-labelledby": titleId }, [
      el("div", { class: "modal-header" }, [
        heading,
        el("button", { type: "button", class: "icon-btn", "aria-label": "Cerrar", onclick: () => close() }, [icon("x")]),
      ]),
      el("div", { class: "modal-body" }, [body]),
      footerNodes.length ? el("div", { class: "modal-footer" }, footerNodes) : null,
    ]),
  ]);

  let previousFocus = null;
  const onKey = (event) => { if (event.key === "Escape") close(); };

  function open() {
    previousFocus = document.activeElement;
    element.classList.remove("hidden");
    document.body.classList.add("has-modal");
    document.addEventListener("keydown", onKey);
    const target = element.querySelector("[data-autofocus]") || element.querySelector(FOCUSABLE) || element.querySelector(".modal-card .btn");
    target?.focus();
  }

  function close() {
    if (element.classList.contains("hidden")) return;
    element.classList.add("hidden");
    document.body.classList.remove("has-modal");
    document.removeEventListener("keydown", onKey);
    previousFocus?.focus?.();
    onClose?.();
  }

  return { element, open, close, setTitle: (text) => { heading.textContent = text; } };
}

/** confirmDialog({ title, message, confirmLabel, tone }) -> Promise<boolean> */
export function confirmDialog({ title = "¿Confirmar?", message = "", confirmLabel = "Confirmar", cancelLabel = "Cancelar", tone = "danger" } = {}) {
  return new Promise((resolve) => {
    let answer = false;
    const finish = (value) => { answer = value; modal.close(); };
    const modal = createModal({
      title,
      body: el("p", { class: "confirm-message" }, [message]),
      footer: [
        el("button", { type: "button", class: "btn btn-secondary", "data-autofocus": true, onclick: () => finish(false) }, [cancelLabel]),
        el("button", { type: "button", class: `btn ${tone === "danger" ? "btn-danger" : "btn-primary"}`, onclick: () => finish(true) }, [confirmLabel]),
      ],
      onClose: () => { setTimeout(() => modal.element.remove(), 0); resolve(answer); },
    });
    modal.element.dataset.size = "sm";
    document.body.append(modal.element);
    modal.open();
  });
}

// ---------- Formularios ----------

/** passwordField({ id, name, label, autocomplete, hint, required, minlength }) -> .field */
export function passwordField({ id, name, label, autocomplete = "current-password", hint, required = true, minlength, placeholder } = {}) {
  const input = el("input", { id, name, type: "password", class: "input", autocomplete, required, minlength, placeholder, "aria-describedby": hint ? `${id}-hint` : undefined });
  const toggle = el("button", { type: "button", class: "input-toggle", "aria-label": "Mostrar contraseña", "aria-pressed": "false" }, [icon("eye")]);
  toggle.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    toggle.setAttribute("aria-pressed", String(show));
    toggle.setAttribute("aria-label", show ? "Ocultar contraseña" : "Mostrar contraseña");
    toggle.replaceChildren(icon(show ? "eye-off" : "eye"));
  });
  const field = el("div", { class: "field" }, [
    el("label", { class: "field-label", for: id }, [label]),
    el("div", { class: "input-group" }, [input, toggle]),
    hint ? el("div", { class: "field-hint", id: `${id}-hint` }, [hint]) : null,
  ]);
  field.input = input;
  return field;
}

/** segmented({ name, options: [{ value, label }], value, onChange }) -> .segmented (con setValue) */
export function segmented({ name, options, value, onChange }) {
  const group = el("div", { class: "segmented", role: "radiogroup" });
  for (const option of options) {
    const input = el("input", { type: "radio", name, value: option.value, checked: option.value === value });
    input.addEventListener("change", () => onChange?.(option.value));
    group.append(el("label", { class: "segmented-option" }, [input, el("span", {}, [option.label])]));
  }
  group.setValue = (next) => {
    group.querySelectorAll("input").forEach((input) => { input.checked = input.value === next; });
  };
  return group;
}

// ---------- Píldoras ----------

/** badge(text, tone) con tone: accent | success | warning | danger | violet | live | neutral */
export function badge(text, tone = "neutral") {
  return el("span", { class: "badge", "data-tone": tone }, [text]);
}

export function methodBadge(method) {
  return el("span", { class: "badge method", "data-method": method }, [method]);
}

// code -> "2xx"... (5xx se dibuja con fondo sólido)
export function statusCodeBadge(code) {
  return el("span", { class: "badge code", "data-class": `${Math.floor(code / 100)}xx` }, [el("i", { class: "badge-dot" }), String(code)]);
}

/** status: online | offline | degraded | console | healthy | failing | no-traffic | connected | disconnected */
export function statusDot(status) {
  return el("span", { class: "dot", "data-status": status, "aria-hidden": "true" });
}

// ---------- KPI ----------

/** kpiCard({ label, value, hint, icon, tone, loading }) -> .kpi (con setValue(value, hint)) */
export function kpiCard({ label, value = "—", hint = "", icon: iconName = "activity", tone = "accent", loading = false }) {
  const valueEl = el("div", { class: "kpi-value num" }, [String(value)]);
  const hintEl = el("div", { class: "kpi-hint" }, [hint]);
  const card = el("div", { class: `kpi${loading ? " is-skeleton" : ""}`, "data-tone": tone }, [
    el("div", { class: "kpi-head" }, [
      el("span", { class: "kpi-chip" }, [icon(iconName)]),
      el("span", { class: "kpi-label" }, [label]),
    ]),
    valueEl,
    hintEl,
  ]);
  card.setValue = (next, nextHint) => {
    valueEl.textContent = String(next);
    if (nextHint !== undefined) hintEl.textContent = nextHint;
    card.classList.remove("is-skeleton");
  };
  return card;
}

// ---------- Tabla ----------

/**
 * dataTable({ columns: [{ key, label, align, render }], rows, empty, onRowClick })
 * render(row, index) devuelve un nodo o texto. En móvil cada fila se vuelve tarjeta (data-label).
 * onRowClick(row): filas seleccionables (clic, Enter o Espacio). Los botones dentro de la fila
 * no la activan: se ignoran los eventos que vienen de button, a, input, select o textarea.
 */
export function dataTable({ columns, rows, empty, onRowClick }) {
  if (!rows.length) return empty || emptyState({ title: "Sin datos", text: "No hay registros para mostrar." });

  const alignClass = (column) => (column.align ? ` is-${column.align}` : "");
  const head = el("tr", {}, columns.map((c) => el("th", { class: alignClass(c).trim(), scope: "col" }, [c.label])));
  const INTERACTIVE = "button, a, input, select, textarea";
  const body = rows.map((row, index) => {
    const tr = el("tr", onRowClick ? { class: "is-clickable", tabindex: "0", role: "button" } : {}, columns.map((c) => {
      const content = c.render ? c.render(row, index) : (row[c.key] ?? "—");
      return el("td", { class: alignClass(c).trim(), "data-label": c.label }, [content]);
    }));
    if (onRowClick) {
      const fromInner = (event) => event.target !== tr && event.target.closest(INTERACTIVE);
      tr.addEventListener("click", (event) => { if (!fromInner(event)) onRowClick(row, index); });
      tr.addEventListener("keydown", (event) => {
        if ((event.key === "Enter" || event.key === " ") && event.target === tr) {
          event.preventDefault();
          onRowClick(row, index);
        }
      });
    }
    return tr;
  });
  return el("div", { class: "table-wrap" }, [el("table", { class: "table" }, [el("thead", {}, [head]), el("tbody", {}, body)])]);
}

// ---------- Detalle (drawer) ----------

/**
 * detailDrawer({ title }) -> { element, open(contentNode, actions?), close, setTitle, showLoading }
 * Panel lateral sobre createModal (Esc y fondo lo cierran). actions: botones del pie.
 * El elemento se agrega al body la primera vez que se abre.
 */
export function detailDrawer({ title = "Detalle" } = {}) {
  const body = el("div", { class: "drawer-content" });
  const footer = el("div", { class: "modal-footer" });
  const modal = createModal({ title, body, onClose: () => setTimeout(() => { if (modal.element.classList.contains("hidden")) modal.element.remove(); }, 0) });
  modal.element.dataset.variant = "drawer";
  modal.element.querySelector(".modal-card").append(footer);
  footer.hidden = true;

  const setActions = (actions = []) => { footer.replaceChildren(...actions); footer.hidden = !actions.length; };
  const show = () => {
    if (!modal.element.isConnected) document.body.append(modal.element);
    if (modal.element.classList.contains("hidden")) modal.open();
  };

  return {
    element: modal.element,
    open(content, actions = []) {
      body.replaceChildren(content);
      body.removeAttribute("aria-busy");
      setActions(actions);
      show();
    },
    showLoading() {
      body.replaceChildren(skeleton(5));
      body.setAttribute("aria-busy", "true");
      setActions([]);
      show();
    },
    close: modal.close,
    setTitle: modal.setTitle,
  };
}

/** descriptionList([{ label, value }]) -> <dl class="detail-list"> (value: texto o nodo) */
export function descriptionList(items) {
  return el("dl", { class: "detail-list" }, items.flatMap(({ label, value }) => [
    el("dt", {}, [label]),
    el("dd", {}, [value === null || value === undefined || value === "" ? "—" : value]),
  ]));
}

/** requestDetailContent(log) -> nodo con el detalle de una petición (log.user opcional) */
export function requestDetailContent(log) {
  const who = log.user
    ? el("span", {}, [log.user.name, el("span", { class: "muted small" }, [` · ${log.user.email}`])])
    : "Sin usuario";
  return descriptionList([
    { label: "Método", value: methodBadge(log.method) },
    { label: "Ruta", value: el("span", { class: "mono" }, [log.path]) },
    { label: "Patrón", value: log.route ? el("span", { class: "mono" }, [log.route]) : "—" },
    { label: "Estado", value: statusCodeBadge(log.statusCode) },
    { label: "Latencia", value: `${formatNumber(log.latencyMs)} ms` },
    { label: "Origen", value: log.source },
    { label: "Fecha", value: formatDate(log.createdAt) },
    { label: "Usuario", value: who },
  ]);
}

// ---------- Paginación ----------

/** pagination({ page, totalPages, total, limit }, onChange) */
export function pagination({ page, totalPages, total, limit }, onChange) {
  if (!total) return el("div", { class: "pagination" }, [el("span", { class: "pagination-info" }, ["Sin resultados"])]);

  const size = limit || Math.ceil(total / Math.max(totalPages, 1));
  const from = (page - 1) * size + 1;
  const to = Math.min(page * size, total);
  const info = el("span", { class: "pagination-info num" }, [`Mostrando ${from}–${to} de ${formatNumber(total)}`]);
  if (totalPages <= 1) return el("div", { class: "pagination" }, [info]);

  const first = Math.max(1, Math.min(page - 2, totalPages - 4));
  const last = Math.min(totalPages, first + 4);
  const pages = [];
  for (let n = first; n <= last; n++) {
    pages.push(el("button", {
      type: "button", class: `page-btn${n === page ? " is-current" : ""}`, "aria-current": n === page ? "page" : undefined,
      "aria-label": `Página ${n}`, onclick: () => onChange(n),
    }, [String(n)]));
  }
  return el("nav", { class: "pagination", "aria-label": "Paginación" }, [
    info,
    el("div", { class: "pagination-pages" }, [
      el("button", { type: "button", class: "page-btn", disabled: page <= 1, "aria-label": "Página anterior", onclick: () => onChange(page - 1) }, ["‹"]),
      ...pages,
      el("button", { type: "button", class: "page-btn", disabled: page >= totalPages, "aria-label": "Página siguiente", onclick: () => onChange(page + 1) }, ["›"]),
    ]),
  ]);
}

// ---------- Gráficas (Chart.js) ----------

const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const TONE_CYCLE = ["accent", "live", "success", "warning", "violet", "danger"];
const METHOD_TONE = { GET: "success", POST: "accent", PUT: "warning", PATCH: "violet", DELETE: "danger" };

// Crea la gráfica leyendo los colores de los tokens y la actualiza si cambia el tema.
function buildChart({ title, items, type }) {
  const canvas = el("canvas", { role: "img", "aria-label": title });
  const box = el("div", { class: "chart-box" }, [canvas]);
  const element = el("div", { class: "card chart-card" }, [
    el("div", { class: "card-header" }, [el("h2", {}, [title])]),
    box,
  ]);

  let chart = null;
  const toneOf = (item, i) => item.tone || (type === "bar" && METHOD_TONE[item.label]) || TONE_CYCLE[i % TONE_CYCLE.length];
  const paint = () => {
    if (!chart) return;
    const text2 = cssVar("--text-2");
    chart.data.datasets[0].backgroundColor = items.map((item, i) => cssVar(`--${toneOf(item, i)}`));
    if (type === "doughnut") {
      chart.options.plugins.legend.labels.color = text2;
    } else {
      chart.options.scales.x.ticks.color = text2;
      chart.options.scales.y.ticks.color = cssVar("--text-3");
      chart.options.scales.y.grid.color = cssVar("--border");
    }
    chart.update("none");
  };

  if (!items.length) {
    box.replaceChildren(el("p", { class: "muted small" }, ["Sin datos todavía."]));
  } else if (window.Chart) {
    const font = { family: cssVar("--font-body"), size: 12 };
    const common = { responsive: true, maintainAspectRatio: false, animation: { duration: 400 } };
    const config = type === "doughnut"
      ? {
          type: "doughnut",
          data: { labels: items.map((i) => i.label), datasets: [{ data: items.map((i) => i.value), borderWidth: 2, borderColor: cssVar("--surface-2") }] },
          options: { ...common, cutout: "68%", plugins: { legend: { position: "bottom", labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, font } } } },
        }
      : {
          type: "bar",
          data: { labels: items.map((i) => i.label), datasets: [{ data: items.map((i) => i.value), borderRadius: 6, maxBarThickness: 44 }] },
          options: {
            ...common,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, border: { display: false }, ticks: { font: { ...font, family: cssVar("--font-mono") } } },
              y: { beginAtZero: true, border: { display: false }, grid: {}, ticks: { precision: 0, font } },
            },
          },
        };
    chart = new window.Chart(canvas.getContext("2d"), config);
    paint();
  }

  const onTheme = () => {
    if (chart && type === "doughnut") chart.data.datasets[0].borderColor = cssVar("--surface-2");
    paint();
  };
  window.addEventListener("theme:changed", onTheme);

  const destroy = () => {
    window.removeEventListener("theme:changed", onTheme);
    chart?.destroy();
    chart = null;
  };
  return { element, destroy };
}

/** doughnutChart({ title, items: [{ label, value, tone? }] }) -> { element, destroy } */
export function doughnutChart({ title, items }) {
  return buildChart({ title, items, type: "doughnut" });
}

/** barChart({ title, items: [{ label, value, tone? }] }) -> { element, destroy } */
export function barChart({ title, items }) {
  return buildChart({ title, items, type: "bar" });
}

// ---------- Arquitectura visual ----------

const ARCH_LAYERS = [
  { key: "client", name: "Cliente / UI", tech: "Navegador · JS vanilla", icon: "globe" },
  { key: "api", name: "Capa API", tech: "Express 4 · REST", icon: "server" },
  { key: "backend", name: "Backend / Lógica", tech: "Node 18 · Servicios", icon: "cpu" },
  { key: "database", name: "Base de datos", tech: "API externa", icon: "database" },
];
const ARCH_SERVICE_OF = { client: null, api: "api", backend: "api", database: "database" };
const ARCH_STEP_MS = 250;

/**
 * architectureGraph({ layers, services }) -> { element, play(resultLayers), reset(), setServices(services) }
 * layers (opcional): [{ key, name, tech }] para cambiar textos. services: lista de GET /metrics/services.
 * play() devuelve una promesa que se resuelve al encender la última capa.
 */
export function architectureGraph({ layers = [], services } = {}) {
  const definitions = ARCH_LAYERS.map((base) => ({ ...base, ...(layers.find((l) => l.key === base.key) || {}) }));
  const nodes = new Map();
  const dots = new Map();
  const links = [];
  const parts = [];

  definitions.forEach((layer, index) => {
    const time = el("span", { class: "arch-time num" }, [""]);
    const dotSlot = el("span", { class: "arch-status" });
    const node = el("div", { class: "arch-node", "data-key": layer.key }, [
      el("span", { class: "arch-icon" }, [icon(layer.icon)]),
      el("div", { class: "arch-text" }, [el("div", { class: "arch-name" }, [layer.name]), el("div", { class: "arch-tech" }, [layer.tech])]),
      el("div", { class: "arch-meta" }, [dotSlot, time]),
    ]);
    nodes.set(layer.key, { node, time });
    dots.set(layer.key, dotSlot);
    if (index > 0) {
      const link = el("div", { class: "arch-link", "aria-hidden": "true" });
      links.push(link);
      parts.push(link);
    }
    parts.push(node);
  });

  const element = el("div", { class: "arch", role: "group", "aria-label": "Arquitectura: Cliente, API, Backend y Base de datos" }, parts);

  function setServices(list) {
    for (const [key, slot] of dots) {
      const serviceKey = ARCH_SERVICE_OF[key];
      const status = key === "client" ? "online" : list?.find((s) => s.key === serviceKey)?.status;
      slot.replaceChildren(...(list || key === "client" ? [statusDot(status || "offline")] : []));
    }
  }
  setServices(services);

  let runId = 0;
  function reset() {
    runId += 1;
    for (const { node, time } of nodes.values()) { node.classList.remove("is-active", "is-done"); time.textContent = ""; }
    links.forEach((link) => link.classList.remove("is-active"));
  }

  async function play(resultLayers = []) {
    reset();
    const current = runId;
    for (let i = 0; i < definitions.length; i++) {
      if (current !== runId) return;
      const { node, time } = nodes.get(definitions[i].key);
      const result = resultLayers.find((l) => l.key === definitions[i].key) || resultLayers[i];
      node.classList.add("is-active");
      links[i - 1]?.classList.add("is-active");
      if (result && result.durationMs !== undefined) time.textContent = `${formatNumber(result.durationMs, { maximumFractionDigits: 1 })} ms`;
      await new Promise((resolve) => setTimeout(resolve, ARCH_STEP_MS));
    }
  }

  return { element, play, reset, setServices };
}

// ---------- Consola de eventos ----------

const MAX_EVENT_LINES = 100;
const EVENT_TIME = new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

function eventSummary({ name, data }) {
  if (!data) return "";
  if (name === "api:activity") return `${data.method} ${data.path} → ${data.statusCode} · ${data.latencyMs} ms`;
  if (name === "stream:heartbeat") return `${data.clients} cliente(s) · activo ${data.uptimeSeconds}s`;
  if (name === "stream:connected") return `cliente ${data.clientId}`;
  if (name === "stream:pong") return `${data.latencyMs} ms de ida y vuelta`;
  return "";
}

/** eventLog() -> { element, add({ name, data, at, summary? }), clear() } */
export function eventLog() {
  const placeholder = el("div", { class: "event-empty" }, ["Esperando eventos…"]);
  const element = el("div", { class: "event-log", role: "log", "aria-live": "off", tabindex: "0", "aria-label": "Eventos en vivo" }, [placeholder]);

  return {
    element,
    add(event) {
      placeholder.remove();
      const line = el("div", { class: "event-line" }, [
        el("span", { class: "event-time num" }, [EVENT_TIME.format(new Date(event.at || Date.now()))]),
        el("span", { class: "badge event-pill", "data-event": event.name }, [event.name]),
        el("span", { class: "event-text" }, [event.summary ?? eventSummary(event)]),
      ]);
      element.prepend(line);
      while (element.children.length > MAX_EVENT_LINES) element.lastElementChild.remove();
    },
    clear() { element.replaceChildren(placeholder); },
  };
}

// ---------- Layout privado: barra lateral, barra superior y contenido ----------

const MENU = [
  { route: "#/dashboard", icon: "chart", label: "Panel", adminOnly: true },
  { route: "#/users", icon: "users", label: "Usuarios", adminOnly: true },
  { route: "#/monitoring", icon: "link", label: "Monitoreo" },
  { route: "#/activity", icon: "activity", label: "Actividad", adminOnly: true },
  { route: "#/profile", icon: "shield", label: "Mi perfil" },
];
const API_LABELS = { online: "API en línea", degraded: "API degradada", offline: "API sin conexión", unknown: "API…" };

function statusPill(label, status) {
  const text = el("span", { class: "status-text" }, [label]);
  const pill = el("div", { class: "status-pill", "data-status": status }, [statusDot(status), text]);
  pill.setLabel = (nextLabel, nextStatus) => {
    text.textContent = nextLabel;
    pill.dataset.status = nextStatus;
    pill.querySelector(".dot").dataset.status = nextStatus;
  };
  return pill;
}

// Un solo listener de Esc para todo el módulo (antes se sumaba uno por cada login).
let closeCurrentMenu = null;
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeCurrentMenu?.(); });

/**
 * renderLayout(root, { user, isAdmin, theme, menu }, { onToggleTheme, onLogout })
 *   -> { content, setActive(route), setHealth(status), setStreamStatus(status) }
 * onToggleTheme() debe devolver el tema nuevo. menu: lista { route, icon, label, adminOnly } (opcional).
 */
export function renderLayout(root, { user, isAdmin, theme, menu = MENU }, { onToggleTheme, onLogout }) {
  const items = menu.filter((item) => !item.adminOnly || isAdmin);
  const titles = Object.fromEntries(items.map((item) => [item.route, item.label]));

  const close = () => { sidebar.classList.remove("is-open"); scrim.classList.remove("is-visible"); toggle.setAttribute("aria-expanded", "false"); };
  const openDrawer = () => { sidebar.classList.add("is-open"); scrim.classList.add("is-visible"); toggle.setAttribute("aria-expanded", "true"); };

  const links = items.map((item) => el("a", { href: item.route, class: "nav-item", "data-route": item.route, onclick: close }, [
    icon(item.icon, "nav-icon"), el("span", {}, [item.label]),
  ]));

  const sidebar = el("aside", { class: "sidebar", id: "sidebar" }, [
    el("div", { class: "brand" }, [
      el("span", { class: "brand-mark" }, [icon("layers")]),
      el("div", { class: "brand-text" }, [el("span", { class: "brand-name" }, ["AXON"]), el("span", { class: "brand-sub" }, ["Stack Flow"])]),
    ]),
    el("nav", { class: "nav", "aria-label": "Principal" }, [el("div", { class: "nav-group-label" }, ["Navegación"]), ...links]),
    el("div", { class: "sidebar-user" }, [
      el("div", { class: "sidebar-user-info" }, [
        el("span", { class: "avatar" }, [initials(user?.name)]),
        el("div", { class: "sidebar-user-text" }, [
          el("div", { class: "sidebar-user-name" }, [user?.name || "—"]),
          badge(user?.role === "admin" ? "Administrador" : "Usuario", user?.role === "admin" ? "accent" : "neutral"),
        ]),
      ]),
      el("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: onLogout }, [icon("logout"), "Cerrar sesión"]),
    ]),
  ]);

  const scrim = el("div", { class: "scrim", onclick: close });
  const toggle = el("button", { type: "button", class: "icon-btn menu-toggle", "aria-label": "Abrir menú", "aria-controls": "sidebar", "aria-expanded": "false" }, [icon("menu")]);
  toggle.addEventListener("click", () => (sidebar.classList.contains("is-open") ? close() : openDrawer()));
  closeCurrentMenu = close; // el único listener de Esc cierra el menú del layout actual

  const title = el("div", { class: "topbar-title" }, [""]);
  const apiPill = statusPill(API_LABELS.unknown, "unknown");
  const streamPill = statusPill(STREAM_LABELS.DISCONNECTED, "disconnected");
  streamPill.classList.add("stream-pill");
  if (!isAdmin) streamPill.classList.add("hidden"); // el tiempo real es solo del administrador

  let currentTheme = theme;
  const themeIcon = () => icon(currentTheme === "light" ? "moon" : "sun");
  const themeButton = el("button", { type: "button", class: "icon-btn", "aria-label": "Cambiar tema" }, [themeIcon()]);
  themeButton.title = currentTheme === "light" ? "Tema oscuro" : "Tema claro";
  themeButton.addEventListener("click", () => {
    currentTheme = onToggleTheme();
    themeButton.replaceChildren(themeIcon());
    themeButton.title = currentTheme === "light" ? "Tema oscuro" : "Tema claro";
  });

  const content = el("div", { id: "page" });
  root.replaceChildren(el("div", { class: "app-shell" }, [
    sidebar,
    scrim,
    el("div", { class: "app-main" }, [
      el("header", { class: "topbar" }, [toggle, title, el("div", { class: "topbar-spacer" }), streamPill, apiPill, themeButton]),
      el("main", { class: "page" }, [content]),
    ]),
  ]));

  return {
    content,
    setActive(route) {
      links.forEach((link) => {
        const active = link.dataset.route === route;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
      });
      title.textContent = titles[route] || "";
    },
    setHealth(status) {
      const key = API_LABELS[status] ? status : "offline";
      apiPill.setLabel(API_LABELS[key], key);
    },
    // status: CONNECTED | CONNECTING | DISCONNECTED
    setStreamStatus(status) {
      streamPill.setLabel(STREAM_LABELS[status] || status, status.toLowerCase());
    },
  };
}

// Texto que ve el usuario para cada estado del tiempo real.
export const STREAM_LABELS = Object.freeze({ CONNECTED: "En vivo", CONNECTING: "Conectando", DISCONNECTED: "Desconectado" });
