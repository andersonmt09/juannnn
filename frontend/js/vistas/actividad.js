// Vista de Actividad (#/activity): estado de la conexión en vivo, consola de eventos e historial paginado.
import { pageHeader, kpiCard, eventLog, segmented, dataTable, pagination, emptyState, errorState, skeleton, methodBadge, statusCodeBadge, statusDot, detailDrawer, requestDetailContent, STREAM_LABELS } from "./componentes.js";
import { el, icon, formatNumber, formatDate } from "../utilidades.js";

const STATUS_FILTERS = [
  { value: "", label: "Todos" }, { value: "2xx", label: "2xx" }, { value: "3xx", label: "3xx" },
  { value: "4xx", label: "4xx" }, { value: "5xx", label: "5xx" },
];
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const TIME = new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
const CONNECTION_TONE = { CONNECTED: "live", CONNECTING: "warning", DISCONNECTED: "danger" };

/**
 * @param {HTMLElement} container
 * @param {{
 *   onSelectRequest: (request: object) => void,
 *   onPing: () => void, onReconnect: () => void, onTogglePause: () => void, onClear: () => void,
 *   onFilterChange: (filters: { statusClass: string, method: string }) => void,
 *   onPageChange: (page: number) => void, onExportPage: () => void, onRetryHistory: () => void,
 * }} handlers
 */
export function renderActivityView(container, handlers) {
  const drawer = detailDrawer({ title: "Detalle de la petición" });

  // ---- KPI ----
  const connection = kpiCard({ label: "Conexión", value: STREAM_LABELS.DISCONNECTED, icon: "radio", tone: "danger", hint: "Tiempo real (SSE)" });
  connection.querySelector(".kpi-value").style.fontSize = "var(--fs-2xl)";
  const reconnectButton = el("button", { type: "button", class: "btn btn-secondary btn-sm hidden", onclick: handlers.onReconnect }, [icon("refresh"), "Reconectar"]);
  connection.append(reconnectButton);
  const received = kpiCard({ label: "Eventos recibidos", value: "0", icon: "activity", tone: "accent", hint: "desde que abriste la sesión" });
  const last = kpiCard({ label: "Último evento", value: "—", icon: "clock", tone: "accent", hint: "Aún no llegan eventos" });
  last.querySelector(".kpi-value").style.fontSize = "var(--fs-2xl)";
  const latency = kpiCard({ label: "Latencia", value: "—", icon: "bolt", tone: "live", hint: "Ida y vuelta (ping)" });
  const pingButton = el("button", { type: "button", class: "btn btn-secondary btn-sm", onclick: handlers.onPing }, [icon("radio"), "Medir latencia"]);
  latency.append(pingButton);

  // ---- Consola ----
  const log = eventLog();
  const pauseButton = el("button", { type: "button", class: "btn btn-secondary btn-sm", onclick: handlers.onTogglePause }, [icon("pause"), "Pausar"]);
  const pausedNote = el("span", { class: "badge hidden", "data-tone": "warning" }, ["En pausa"]);
  const consoleCard = el("section", { class: "card" }, [
    el("div", { class: "card-header" }, [
      el("div", { class: "row" }, [el("h2", {}, ["Consola en vivo"]), pausedNote]),
      el("div", { class: "row" }, [
        pauseButton,
        el("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: handlers.onClear }, [icon("trash"), "Limpiar"]),
      ]),
    ]),
    log.element,
  ]);

  const nodes = [
    pageHeader({ title: "Actividad", subtitle: "Eventos en vivo de la API y su historial de peticiones" }),
    el("div", { class: "grid-kpi" }, [connection, received, last, latency]),
    consoleCard,
  ];

  // ---- Historial ----
  let filters = { statusClass: "", method: "" };
  const historyBody = el("div", {}, [skeleton(5)]);
  const statusFilter = segmented({
    name: "history-status", options: STATUS_FILTERS, value: "",
    onChange: (value) => { filters = { ...filters, statusClass: value }; handlers.onFilterChange(filters); },
  });
  const methodSelect = el("select", { class: "input", "aria-label": "Filtrar por método", style: "width:auto;min-width:140px" }, [
    el("option", { value: "" }, ["Todos los métodos"]),
    ...METHODS.map((m) => el("option", { value: m }, [m])),
  ]);
  methodSelect.addEventListener("change", () => { filters = { ...filters, method: methodSelect.value }; handlers.onFilterChange(filters); });

  nodes.push(el("section", { class: "card" }, [
    el("div", { class: "card-header" }, [
      el("h2", {}, ["Historial de peticiones"]),
      el("button", { type: "button", class: "btn btn-secondary btn-sm", onclick: handlers.onExportPage }, [icon("download"), "Exportar CSV"]),
    ]),
    el("div", { class: "row", style: "margin-bottom:var(--sp-4)" }, [statusFilter, methodSelect]),
    historyBody,
  ]));

  container.replaceChildren(...nodes);

  const historyColumns = [
    { key: "method", label: "Método", render: (r) => methodBadge(r.method) },
    { key: "path", label: "Ruta", render: (r) => el("span", { class: "mono" }, [r.path]) },
    { key: "statusCode", label: "Estado", render: (r) => statusCodeBadge(r.statusCode) },
    { key: "latencyMs", label: "Latencia", align: "right", render: (r) => `${formatNumber(r.latencyMs)} ms` },
    { key: "createdAt", label: "Fecha", render: (r) => el("span", { class: "muted small" }, [formatDate(r.createdAt)]) },
  ];

  return {
    log,

    // Agrega una línea a la consola; si es una petición con id, se puede abrir.
    addEvent(event) {
      log.add(event);
      const id = event.name === "api:activity" ? event.data?.id : null;
      const line = log.element.firstElementChild;
      if (!id || !line) return;
      const open = () => handlers.onSelectRequest(event.data);
      line.classList.add("is-clickable");
      line.setAttribute("tabindex", "0");
      line.setAttribute("role", "button");
      line.style.cursor = "pointer";
      line.addEventListener("click", open);
      line.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    },

    showRequestLoading() { drawer.showLoading(); },
    showRequestDetail(logData) { drawer.open(requestDetailContent(logData)); },
    closeRequestDetail() { drawer.close(); },

    // status: CONNECTED | CONNECTING | DISCONNECTED
    setConnection(status) {
      connection.setValue(STREAM_LABELS[status] || status);
      connection.dataset.tone = CONNECTION_TONE[status] || "danger";
      const hint = connection.querySelector(".kpi-hint");
      hint.replaceChildren(statusDot(status.toLowerCase()), " Tiempo real (SSE)");
      hint.classList.add("row");
      reconnectButton.classList.toggle("hidden", status !== "DISCONNECTED");
    },

    setReceived(count) {
      received.setValue(formatNumber(count));
    },

    setLastEvent(event) {
      if (!event) { last.setValue("—", "Aún no llegan eventos"); return; }
      last.setValue(TIME.format(new Date(event.at)), event.name);
    },

    setLatency(ms) {
      latency.setValue(ms === null ? "—" : `${formatNumber(ms)} ms`, "Ida y vuelta (ping)");
    },

    setPinging(pinging) {
      pingButton.classList.toggle("is-loading", pinging);
      pingButton.disabled = pinging;
    },

    setPaused(paused) {
      pauseButton.replaceChildren(icon(paused ? "play" : "pause"), paused ? "Reanudar" : "Pausar");
      pausedNote.classList.toggle("hidden", !paused);
    },

    showHistoryLoading() {
      historyBody.replaceChildren(skeleton(5));
    },

    showHistory(logs, meta) {
      const empty = emptyState({ icon: "activity", title: "Sin peticiones", text: "No hay registros con esos filtros." });
      historyBody.replaceChildren(dataTable({ columns: historyColumns, rows: logs, empty, onRowClick: handlers.onSelectRequest }), ...(logs.length ? [pagination(meta, handlers.onPageChange)] : []));
    },

    showHistoryError() {
      historyBody.replaceChildren(errorState({ text: "No se pudo cargar el historial.", onRetry: handlers.onRetryHistory }));
    },
  };
}
