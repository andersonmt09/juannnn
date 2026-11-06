import { pageHeader, kpiCard, eventLog, segmented, dataTable, pagination, emptyState, errorState, skeleton, methodBadge, statusCodeBadge, statusDot, detailDrawer, requestDetailContent, STREAM_LABELS, sectionCell, ACTION_LABEL, EVENT_NAMES } from "./componentes.js";
import { el, icon, formatNumber, formatDate } from "../utilidades.js";

const STATUS_FILTERS = [
  { value: "", label: "Todos" }, { value: "2xx", label: "Correctas" },
  { value: "4xx", label: "Rechazadas" }, { value: "5xx", label: "Fallas" },
];
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const TIME = new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
const CONNECTION_TONE = { CONNECTED: "live", CONNECTING: "warning", DISCONNECTED: "danger" };

export function renderActivityView(container, handlers) {
  const drawer = detailDrawer({ title: "Detalle de la solicitud" });

  const connection = kpiCard({ label: "Conexión", value: STREAM_LABELS.DISCONNECTED, icon: "radio", tone: "danger", hint: "En vivo" });
  connection.querySelector(".kpi-value").style.fontSize = "var(--fs-2xl)";
  const reconnectButton = el("button", { type: "button", class: "btn btn-secondary btn-sm hidden", onclick: handlers.onReconnect }, [icon("refresh"), "Reconectar"]);
  connection.append(reconnectButton);
  const received = kpiCard({ label: "Eventos recibidos", value: "0", icon: "activity", tone: "accent", hint: "desde que abriste la sesión" });
  const last = kpiCard({ label: "Último evento", value: "—", icon: "clock", tone: "accent", hint: "Aún no llegan eventos" });
  last.querySelector(".kpi-value").style.fontSize = "var(--fs-2xl)";
  const latency = kpiCard({ label: "Tiempo de respuesta", value: "—", icon: "bolt", tone: "live", hint: "Qué tan rápido responde" });
  const pingButton = el("button", { type: "button", class: "btn btn-secondary btn-sm", onclick: handlers.onPing }, [icon("radio"), "Medir velocidad"]);
  latency.append(pingButton);

  const log = eventLog();
  const pauseButton = el("button", { type: "button", class: "btn btn-secondary btn-sm", onclick: handlers.onTogglePause }, [icon("pause"), "Pausar"]);
  const pausedNote = el("span", { class: "badge hidden", "data-tone": "warning" }, ["En pausa"]);
  const consoleCard = el("section", { class: "card" }, [
    el("div", { class: "card-header" }, [
      el("div", { class: "row" }, [el("h2", {}, ["Lo que está pasando"]), pausedNote]),
      el("div", { class: "row" }, [
        pauseButton,
        el("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: handlers.onClear }, [icon("trash"), "Limpiar"]),
      ]),
    ]),
    log.element,
  ]);

  const nodes = [
    pageHeader({ title: "Actividad", subtitle: "Lo que pasa en el sistema, en el momento en que ocurre" }),
    el("div", { class: "grid-kpi" }, [connection, received, last, latency]),
    consoleCard,
  ];

  let filters = { statusClass: "", method: "" };
  const historyBody = el("div", {}, [skeleton(5)]);
  const statusFilter = segmented({
    name: "history-status", options: STATUS_FILTERS, value: "",
    onChange: (value) => { filters = { ...filters, statusClass: value }; handlers.onFilterChange(filters); },
  });
  const methodSelect = el("select", { class: "input", "aria-label": "Filtrar por método", style: "width:auto;min-width:140px" }, [
    el("option", { value: "" }, ["Todas las acciones"]),
    ...METHODS.map((m) => el("option", { value: m }, [ACTION_LABEL[m] || m])),
  ]);
  methodSelect.addEventListener("change", () => { filters = { ...filters, method: methodSelect.value }; handlers.onFilterChange(filters); });

  nodes.push(el("section", { class: "card" }, [
    el("div", { class: "card-header" }, [
      el("h2", {}, ["Historial de solicitudes"]),
      el("button", { type: "button", class: "btn btn-secondary btn-sm", onclick: handlers.onExportPage }, [icon("download"), "Descargar"]),
    ]),
    el("div", { class: "row", style: "margin-bottom:var(--sp-4)" }, [statusFilter, methodSelect]),
    historyBody,
  ]));

  container.replaceChildren(...nodes);

  const historyColumns = [
    { key: "method", label: "Acción", render: (r) => methodBadge(r.method) },
    { key: "path", label: "Sección", render: (r) => sectionCell(r.path) },
    { key: "statusCode", label: "Resultado", render: (r) => statusCodeBadge(r.statusCode) },
    { key: "latencyMs", label: "Tiempo", align: "right", render: (r) => `${formatNumber(r.latencyMs)} ms` },
    { key: "createdAt", label: "Fecha", render: (r) => el("span", { class: "muted small" }, [formatDate(r.createdAt)]) },
  ];

  return {
    log,

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

    setConnection(status) {
      connection.setValue(STREAM_LABELS[status] || status);
      connection.dataset.tone = CONNECTION_TONE[status] || "danger";
      const hint = connection.querySelector(".kpi-hint");
      hint.replaceChildren(statusDot(status.toLowerCase()), " En vivo");
      hint.classList.add("row");
      reconnectButton.classList.toggle("hidden", status !== "DISCONNECTED");
    },

    setReceived(count) {
      received.setValue(formatNumber(count));
    },

    setLastEvent(event) {
      if (!event) { last.setValue("—", "Aún no llegan eventos"); return; }
      last.setValue(TIME.format(new Date(event.at)), EVENT_NAMES[event.name] || "Evento");
    },

    setLatency(ms) {
      latency.setValue(ms === null ? "—" : `${formatNumber(ms)} ms`, "Qué tan rápido responde");
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
      const empty = emptyState({ icon: "activity", title: "Sin solicitudes", text: "No hay registros con esos filtros." });
      historyBody.replaceChildren(dataTable({ columns: historyColumns, rows: logs, empty, onRowClick: handlers.onSelectRequest }), ...(logs.length ? [pagination(meta, handlers.onPageChange)] : []));
    },

    showHistoryError() {
      historyBody.replaceChildren(errorState({ text: "No se pudo cargar el historial.", onRetry: handlers.onRetryHistory }));
    },
  };
}
