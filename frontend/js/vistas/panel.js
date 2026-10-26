// Vista del panel (#/dashboard). Solo dibuja los datos que recibe y avisa por callbacks.
import {
  pageHeader, kpiCard, architectureGraph, doughnutChart, barChart, dataTable, emptyState,
  errorState, skeleton, segmented, badge, methodBadge, statusCodeBadge, statusDot, detailDrawer, requestDetailContent,
} from "./componentes.js";
import { el, icon, formatNumber } from "../utilidades.js";

const OPERATIONS = [
  { value: "users", label: "Usuarios" },
  { value: "endpoints", label: "Endpoints" },
  { value: "requests", label: "Peticiones" },
];
const SERVICE_LABEL = { online: "En línea", offline: "Sin conexión", console: "Consola", degraded: "Degradado" };
const STATUS_CLASSES = [
  { key: "2xx", tone: "success" }, { key: "3xx", tone: "live" },
  { key: "4xx", tone: "warning" }, { key: "5xx", tone: "danger" },
];
const TONE_VAR = { success: "--success", live: "--live", warning: "--warning", danger: "--danger", accent: "--accent", violet: "--violet" };
const TIME = new Intl.DateTimeFormat("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

const card = (title, body, extra = null, className = "") =>
  el("section", { class: `card ${className}`.trim() }, [
    el("div", { class: "card-header" }, [el("h2", {}, [title]), extra]),
    body,
  ]);

// Agrupa los códigos HTTP por clase (2xx..5xx) para la dona.
function statusItems(byStatus = []) {
  const totals = {};
  for (const { status, count } of byStatus) {
    const key = `${Math.floor(status / 100)}xx`;
    totals[key] = (totals[key] || 0) + count;
  }
  return STATUS_CLASSES.filter(({ key }) => totals[key]).map(({ key, tone }) => ({ label: key, value: totals[key], tone }));
}

// Sin Chart.js (CDN caído) se dibujan barras simples con los mismos datos.
function fallbackChart(title, items) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const rows = items.map((item) => {
    const fill = el("span");
    fill.style.width = `${Math.max(4, (item.value / max) * 100)}%`;
    fill.style.background = `var(${TONE_VAR[item.tone] || "--accent"})`;
    const bar = el("div", { class: "rate-bar" }, [fill]);
    bar.style.width = "100%";
    bar.style.height = "8px";
    return el("div", { class: "stack" }, [
      el("div", { class: "row-between" }, [el("span", { class: "mono small" }, [item.label]), el("span", { class: "num small muted" }, [formatNumber(item.value)])]),
      bar,
    ]);
  });
  const body = rows.length ? el("div", { class: "stack" }, rows) : el("p", { class: "muted small" }, ["Sin datos todavía."]);
  return { element: card(title, body, null, "chart-card"), destroy() {} };
}

function chartOrFallback(kind, title, items) {
  if (!window.Chart) return fallbackChart(title, items);
  return kind === "bar" ? barChart({ title, items }) : doughnutChart({ title, items });
}

function activityTable(rows, onSelect) {
  return dataTable({
    columns: [
      { key: "method", label: "Método", render: (r) => methodBadge(r.method) },
      { key: "path", label: "Ruta", render: (r) => el("span", { class: "mono small" }, [r.path]) },
      { key: "statusCode", label: "Estado", render: (r) => statusCodeBadge(r.statusCode) },
      { key: "latencyMs", label: "Latencia", align: "right", render: (r) => el("span", { class: "num" }, [`${formatNumber(r.latencyMs)} ms`]) },
      { key: "createdAt", label: "Hora", render: (r) => el("span", { class: "num small" }, [r.createdAt ? TIME.format(new Date(r.createdAt)) : "—"]) },
    ],
    rows,
    onRowClick: onSelect,
    empty: emptyState({ icon: "activity", title: "Sin actividad", text: "Aún no se registran peticiones a la API." }),
  });
}

function servicesList(services) {
  if (!services.length) return emptyState({ icon: "server", title: "Sin servicios", text: "No hay información de servicios." });
  return el("div", { class: "service-list" }, services.map((s) => el("div", { class: "service-item" }, [
    statusDot(s.status),
    el("div", {}, [
      el("div", { class: "service-name" }, [s.name]),
      el("div", { class: "small muted" }, [s.role]),
      el("div", { class: "service-detail" }, [s.detail]),
    ]),
    badge(SERVICE_LABEL[s.status] || s.status, s.status === "online" ? "success" : s.status === "console" ? "warning" : "danger"),
  ])));
}

/**
 * createDashboardView(container, { userName }, { onRefresh, onExport, onSelectRequest })
 *  -> { showLoading, showError, showData, update, setRefreshing, setUpdatedAt, bindSimulation, playSimulation, destroy }
 */
export function createDashboardView(container, { userName }, { onRefresh, onExport, onSelectRequest }) {
  const drawer = detailDrawer({ title: "Detalle de la petición" });
  let charts = [];
  let graph = null;
  let kpis = null;
  let activityBox = null;
  let simUi = null;
  let onRun = null;

  const refreshBtn = el("button", { type: "button", class: "btn btn-secondary", onclick: () => onRefresh() }, [icon("refresh"), "Actualizar"]);
  const exportBtn = el("button", { type: "button", class: "btn btn-secondary", onclick: () => onExport() }, [icon("download"), "Exportar CSV"]);
  const subtitle = el("span", {}, [`Hola, ${userName || ""}`]);
  const header = pageHeader({ title: "Panel de control", subtitle, actions: [refreshBtn, exportBtn] });
  const body = el("div", { class: "stack" });
  container.replaceChildren(header, body);

  const clearCharts = () => { charts.forEach((c) => c.destroy()); charts = []; };

  function showLoading() {
    clearCharts();
    graph = null; kpis = null; activityBox = null; simUi = null;
    const labels = [["Solicitudes totales", "activity"], ["Usuarios activos", "users"], ["Latencia promedio", "clock"], ["Errores ≥ 400", "alert"], ["Endpoints monitoreados", "link"]];
    body.replaceChildren(
      el("div", { class: "grid-kpi" }, labels.map(([label, ic]) => kpiCard({ label, icon: ic, loading: true }))),
      el("div", { class: "grid-2-1" }, [card("Arquitectura", skeleton(5)), card("Simular petición", skeleton(4))]),
      el("div", { class: "grid-2" }, [card("Estados de respuesta", skeleton(5)), card("Peticiones por método", skeleton(5))]),
      el("div", { class: "grid-1-2" }, [card("Servicios", skeleton(5)), card("Actividad reciente", skeleton(6))]),
    );
  }

  function showError(onRetry) {
    clearCharts();
    graph = null; kpis = null; activityBox = null; simUi = null;
    body.replaceChildren(el("div", { class: "card" }, [errorState({ text: "No se pudo cargar el panel de control.", onRetry })]));
  }

  // Actualiza los KPI y la tabla de actividad (también en vivo).
  function update(summary, recent) {
    if (!kpis) return;
    const errorPct = (summary.errorRate || 0) * 100;
    kpis.requests.setValue(formatNumber(summary.requestsTotal), `${formatNumber(summary.requestsLast24h)} en 24 h`);
    kpis.users.setValue(formatNumber(summary.usersActive), `de ${formatNumber(summary.usersTotal)} usuarios`);
    kpis.latency.setValue(`${formatNumber(summary.avgLatencyMs, { maximumFractionDigits: 0 })} ms`, "promedio de todas las peticiones");
    kpis.errors.setValue(formatNumber(summary.errorsTotal), `${formatNumber(errorPct, { maximumFractionDigits: 1 })} % de las peticiones`);
    kpis.endpoints.setValue(formatNumber(summary.monitoredEndpoints), "en seguimiento");
    activityBox?.replaceChildren(activityTable(recent, onSelectRequest));
  }

  function buildSimulationCard() {
    let operation = OPERATIONS[0].value;
    const op = segmented({ name: "sim-operation", options: OPERATIONS, value: operation, onChange: (v) => { operation = v; } });
    const forceInput = el("input", { type: "checkbox", id: "sim-force" });
    const force = el("label", { class: "switch", for: "sim-force" }, [forceInput, el("span", { class: "switch-track" }), el("span", {}, ["Forzar error 500"])]);
    const runBtn = el("button", { type: "button", class: "btn btn-primary" }, [icon("play"), "Ejecutar"]);
    const result = el("div", { class: "stack", "aria-live": "polite" });
    runBtn.addEventListener("click", () => onRun?.({ operation, forceError: forceInput.checked }));
    const node = el("div", { class: "card-body" }, [
      el("p", { class: "small muted" }, ["Envía una petición real y mira cómo cruza cada capa."]),
      op, force, el("div", {}, [runBtn]), result,
    ]);
    return { node, runBtn, result };
  }

  const buildCharts = (dashboard) => [
    chartOrFallback("doughnut", "Estados de respuesta", statusItems(dashboard.requestsByStatus)),
    chartOrFallback("bar", "Peticiones por método", (dashboard.requestsByMethod || []).map((m) => ({ label: m.method, value: m.count }))),
  ];

  // Actualización suave: KPI, tabla y gráficos sin tocar la simulación ni el grafo.
  function refreshData({ dashboard, recent }) {
    if (!kpis) return;
    const old = charts;
    charts = buildCharts(dashboard);
    old.forEach((c, i) => { c.element.replaceWith(charts[i].element); c.destroy(); });
    update(dashboard.summary, recent);
  }

  function showData({ dashboard, services, recent }) {
    clearCharts();
    kpis = {
      requests: kpiCard({ label: "Solicitudes totales", icon: "activity", tone: "accent" }),
      users: kpiCard({ label: "Usuarios activos", icon: "users", tone: "success" }),
      latency: kpiCard({ label: "Latencia promedio", icon: "clock", tone: "live" }),
      errors: kpiCard({ label: "Errores ≥ 400", icon: "alert", tone: "danger" }),
      endpoints: kpiCard({ label: "Endpoints monitoreados", icon: "link", tone: "warning" }),
    };

    graph = architectureGraph({ services });
    simUi = buildSimulationCard();
    activityBox = el("div", {});

    charts = buildCharts(dashboard);
    const [statusChart, methodChart] = charts;

    body.replaceChildren(
      el("div", { class: "grid-kpi" }, Object.values(kpis)),
      el("div", { class: "grid-2-1" }, [card("Arquitectura", graph.element), card("Simular petición", simUi.node)]),
      el("div", { class: "grid-2" }, [statusChart.element, methodChart.element]),
      el("div", { class: "grid-1-2" }, [
        card("Servicios", servicesList(services)),
        card("Actividad reciente", activityBox, el("a", { class: "card-link", href: "#/activity" }, ["Ver todo"])),
      ]),
    );
    update(dashboard.summary, recent);
  }

  return {
    showLoading,
    showError,
    showData,
    refreshData,
    showRecent(recent) { activityBox?.replaceChildren(activityTable(recent, onSelectRequest)); },
    update,
    setRefreshing(on) { refreshBtn.classList.toggle("is-loading", on); refreshBtn.disabled = on; },
    setUpdatedAt(date) { subtitle.textContent = `Hola, ${userName || ""} · Actualizado ${TIME.format(date)}`; },
    // run({ operation, forceError }) lo atiende el controlador.
    bindSimulation(handler) { onRun = handler; },
    setRunning(on) { simUi?.runBtn.classList.toggle("is-loading", on); if (simUi) simUi.runBtn.disabled = on; },
    // result: { layers, totalMs, data } o, si falló, { failed: true, message, totalMs }.
    async playSimulation(result) {
      if (!graph || !simUi) return;
      const out = simUi.result;
      const failed = Boolean(result.failed);
      out.replaceChildren(el("div", { class: "row" }, [
        badge(failed ? "Falló" : "Correcto", failed ? "danger" : "success"),
        el("span", { class: "num small" }, [`${formatNumber(result.totalMs, { maximumFractionDigits: 0 })} ms en total`]),
      ]));
      await graph.play(result.layers || []);
      if (!simUi || simUi.result !== out) return; // la pantalla cambió mientras tanto
      if (failed) out.append(el("p", { class: "small" }, [result.message]));
      else out.append(el("details", {}, [el("summary", {}, ["Ver datos devueltos"]), el("pre", { class: "code" }, [JSON.stringify(result.data, null, 2)])]));
    },
    showRequestLoading() { drawer.showLoading(); },
    showRequestDetail(log) { drawer.open(requestDetailContent(log)); },
    closeRequestDetail() { drawer.close(); },
    destroy() { clearCharts(); graph?.reset(); drawer.close(); },
  };
}
