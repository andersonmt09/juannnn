import {
  pageHeader, kpiCard, architectureGraph, doughnutChart, barChart, dataTable, emptyState,
  errorState, skeleton, segmented, badge, methodBadge, statusCodeBadge, statusDot, detailDrawer, requestDetailContent, ACTION_LABEL, sectionCell,
} from "./componentes.js";
import { el, icon, formatNumber } from "../utilidades.js";

const OPERATIONS = [
  { value: "users", label: "Usuarios" },
  { value: "endpoints", label: "Secciones" },
  { value: "requests", label: "Solicitudes" },
];
const SERVICE_LABEL = { online: "Funcionando", offline: "Sin conexión", console: "Modo de prueba", degraded: "Lento" };
// el servidor manda nombres técnicos: aquí se muestran en palabras simples
const SERVICE_TEXT = {
  database: { name: "Base de datos", role: "Guarda toda la información", detail: (s) => (s.status === "online" ? "Responde correctamente" : "No responde") },
  api: { name: "Sistema", role: "Atiende las solicitudes", detail: () => "Funcionando sin problemas" },
  realtime: { name: "Actividad en vivo", role: "Muestra lo que pasa al instante", detail: (s) => s.detail.replace("clientes conectados", "personas conectadas").replace("cliente conectado", "persona conectada") },
  mail: { name: "Correo", role: "Envía los códigos de acceso", detail: (s) => (s.status === "online" ? "Enviando correos" : "Los códigos se muestran en el servidor") },
};
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

function statusItems(byStatus = []) {
  const totals = {};
  for (const { status, count } of byStatus) {
    const key = `${Math.floor(status / 100)}xx`;
    totals[key] = (totals[key] || 0) + count;
  }
  return STATUS_CLASSES.filter(({ key }) => totals[key]).map(({ key, tone }) => ({ label: { "2xx": "Correctas", "3xx": "Redirigidas", "4xx": "Rechazadas", "5xx": "Fallas del sistema" }[key], value: totals[key], tone }));
}

// sin Chart.js se dibujan barras simples
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
      { key: "method", label: "Acción", render: (r) => methodBadge(r.method) },
      { key: "path", label: "Sección", render: (r) => sectionCell(r.path) },
      { key: "statusCode", label: "Resultado", render: (r) => statusCodeBadge(r.statusCode) },
      { key: "latencyMs", label: "Tiempo", align: "right", render: (r) => el("span", { class: "num" }, [`${formatNumber(r.latencyMs)} ms`]) },
      { key: "createdAt", label: "Hora", render: (r) => el("span", { class: "num small" }, [r.createdAt ? TIME.format(new Date(r.createdAt)) : "—"]) },
    ],
    rows,
    onRowClick: onSelect,
    empty: emptyState({ icon: "activity", title: "Sin actividad", text: "Todavía no hay solicitudes registradas." }),
  });
}

function servicesList(services) {
  if (!services.length) return emptyState({ icon: "server", title: "Sin información", text: "Todavía no hay datos del estado del sistema." });
  return el("div", { class: "service-list" }, services.map((s) => el("div", { class: "service-item" }, [
    statusDot(s.status),
    el("div", {}, [
      el("div", { class: "service-name" }, [SERVICE_TEXT[s.key]?.name || s.name]),
      el("div", { class: "small muted" }, [SERVICE_TEXT[s.key]?.role || s.role]),
      el("div", { class: "service-detail" }, [SERVICE_TEXT[s.key]?.detail(s) || s.detail]),
    ]),
    badge(SERVICE_LABEL[s.status] || s.status, s.status === "online" ? "success" : s.status === "console" ? "warning" : "danger"),
  ])));
}

export function createDashboardView(container, { userName }, { onRefresh, onExport, onSelectRequest }) {
  const drawer = detailDrawer({ title: "Detalle de la solicitud" });
  let charts = [];
  let graph = null;
  let kpis = null;
  let activityBox = null;
  let simUi = null;
  let onRun = null;

  const refreshBtn = el("button", { type: "button", class: "btn btn-secondary", onclick: () => onRefresh() }, [icon("refresh"), "Actualizar"]);
  const exportBtn = el("button", { type: "button", class: "btn btn-secondary", onclick: () => onExport() }, [icon("download"), "Descargar"]);
  const subtitle = el("span", {}, [`Hola, ${userName || ""}`]);
  const header = pageHeader({ title: "Panel de control", subtitle, actions: [refreshBtn, exportBtn] });
  const body = el("div", { class: "stack" });
  container.replaceChildren(header, body);

  const clearCharts = () => { charts.forEach((c) => c.destroy()); charts = []; };

  function showLoading() {
    clearCharts();
    graph = null; kpis = null; activityBox = null; simUi = null;
    const labels = [["Solicitudes totales", "activity"], ["Usuarios activos", "users"], ["Tiempo de respuesta", "clock"], ["Solicitudes con error", "alert"], ["Secciones vigiladas", "link"]];
    body.replaceChildren(
      el("div", { class: "grid-kpi" }, labels.map(([label, ic]) => kpiCard({ label, icon: ic, loading: true }))),
      el("div", { class: "grid-2-1" }, [card("Recorrido de una solicitud", skeleton(5)), card("Probar el sistema", skeleton(4))]),
      el("div", { class: "grid-2" }, [card("Resultados", skeleton(5)), card("Solicitudes por tipo", skeleton(5))]),
      el("div", { class: "grid-1-2" }, [card("Estado del sistema", skeleton(5)), card("Actividad reciente", skeleton(6))]),
    );
  }

  function showError(onRetry) {
    clearCharts();
    graph = null; kpis = null; activityBox = null; simUi = null;
    body.replaceChildren(el("div", { class: "card" }, [errorState({ text: "No se pudo cargar el panel de control.", onRetry })]));
  }

  function update(summary, recent) {
    if (!kpis) return;
    const errorPct = (summary.errorRate || 0) * 100;
    kpis.requests.setValue(formatNumber(summary.requestsTotal), `${formatNumber(summary.requestsLast24h)} en 24 h`);
    kpis.users.setValue(formatNumber(summary.usersActive), `de ${formatNumber(summary.usersTotal)} usuarios`);
    kpis.latency.setValue(`${formatNumber(summary.avgLatencyMs, { maximumFractionDigits: 0 })} ms`, "promedio de todas las solicitudes");
    kpis.errors.setValue(formatNumber(summary.errorsTotal), `${formatNumber(errorPct, { maximumFractionDigits: 1 })} % de las solicitudes`);
    kpis.endpoints.setValue(formatNumber(summary.monitoredEndpoints), "en seguimiento");
    activityBox?.replaceChildren(activityTable(recent, onSelectRequest));
  }

  function buildSimulationCard() {
    let operation = OPERATIONS[0].value;
    const op = segmented({ name: "sim-operation", options: OPERATIONS, value: operation, onChange: (v) => { operation = v; } });
    const forceInput = el("input", { type: "checkbox", id: "sim-force" });
    const force = el("label", { class: "switch", for: "sim-force" }, [forceInput, el("span", { class: "switch-track" }), el("span", {}, ["Simular una falla"])]);
    const runBtn = el("button", { type: "button", class: "btn btn-primary" }, [icon("play"), "Ejecutar"]);
    const result = el("div", { class: "stack", "aria-live": "polite" });
    runBtn.addEventListener("click", () => onRun?.({ operation, forceError: forceInput.checked }));
    const node = el("div", { class: "card-body" }, [
      el("p", { class: "small muted" }, ["Haz una prueba y mira paso a paso cómo responde el sistema."]),
      op, force, el("div", {}, [runBtn]), result,
    ]);
    return { node, runBtn, result };
  }

  const buildCharts = (dashboard) => [
    chartOrFallback("doughnut", "Resultados", statusItems(dashboard.requestsByStatus)),
    chartOrFallback("bar", "Solicitudes por tipo", (dashboard.requestsByMethod || []).map((m) => ({ label: ACTION_LABEL[m.method] || m.method, value: m.count }))),
  ];

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
      latency: kpiCard({ label: "Tiempo de respuesta", icon: "clock", tone: "live" }),
      errors: kpiCard({ label: "Solicitudes con error", icon: "alert", tone: "danger" }),
      endpoints: kpiCard({ label: "Secciones vigiladas", icon: "link", tone: "warning" }),
    };

    graph = architectureGraph({ services });
    simUi = buildSimulationCard();
    activityBox = el("div", {});

    charts = buildCharts(dashboard);
    const [statusChart, methodChart] = charts;

    body.replaceChildren(
      el("div", { class: "grid-kpi" }, Object.values(kpis)),
      el("div", { class: "grid-2-1" }, [card("Recorrido de una solicitud", graph.element), card("Probar el sistema", simUi.node)]),
      el("div", { class: "grid-2" }, [statusChart.element, methodChart.element]),
      el("div", { class: "grid-1-2" }, [
        card("Estado del sistema", servicesList(services)),
        card("Actividad reciente", activityBox, el("a", { class: "card-link", href: "actividad.html" }, ["Ver todo"])),
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
    bindSimulation(handler) { onRun = handler; },
    setRunning(on) { simUi?.runBtn.classList.toggle("is-loading", on); if (simUi) simUi.runBtn.disabled = on; },
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
