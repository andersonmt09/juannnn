// Vista de monitoreo (#/monitoring): mini KPI y tabla de endpoints vigilados con sus estadísticas reales.
// El botón de agregar y el de quitar solo se dibujan para administradores.
import { pageHeader, emptyState, errorState, skeleton, kpiCard, dataTable, createModal, methodBadge, statusDot, statusCodeBadge, detailDrawer, descriptionList, requestDetailContent } from "./componentes.js";
import { el, icon, formatNumber, formatRelative, formatDate } from "../utilidades.js";

const HIGH_ERROR_RATE = 0.2; // 20 % o más de respuestas con error = fallando
const STATUS_LABEL = { healthy: "Saludable", failing: "Con errores", "no-traffic": "Sin tráfico" };

const rateOf = ({ requests, errors, errorRate }) => errorRate ?? (requests ? errors / requests : 0);

// Número de errores y una barra fina con la tasa.
function errorsCell(stats) {
  const rate = rateOf(stats);
  const tone = rate >= HIGH_ERROR_RATE ? "danger" : rate > 0 ? "warning" : "success";
  const percent = `${formatNumber(rate * 100, { maximumFractionDigits: 1 })} %`;
  return el("div", { class: "rate", style: "white-space:nowrap", title: `${percent} de las peticiones` }, [
    el("span", { class: "num" }, [formatNumber(stats.errors)]),
    el("div", { class: "rate-bar", "data-tone": tone }, [el("span", { style: `width:${Math.min(100, Math.round(rate * 100))}%` })]),
  ]);
}

/**
 * @param {HTMLElement} container
 * @param {{ canManage: boolean }} data
 * @param {{ onSelect: (endpoint: object) => void, onSelectRequest: (request: object) => void, onOpenForm: () => void, onSave: (data: object) => void, onDelete: (endpoint: object) => void, onRefresh: () => void }} handlers
 */
export function renderMonitoringView(container, { canManage }, handlers) {
  const kpis = {
    total: kpiCard({ label: "Monitoreados", icon: "link", tone: "accent", loading: true }),
    healthy: kpiCard({ label: "Saludables", icon: "check", tone: "success", loading: true }),
    failing: kpiCard({ label: "Con errores", icon: "alert", tone: "danger", loading: true }),
    idle: kpiCard({ label: "Sin tráfico", icon: "clock", tone: "warning", loading: true }),
  };
  const tableCard = el("div", { class: "card card-flush" }, [skeleton(5)]);

  // ---- Modal para agregar ----
  const routeSelect = el("select", { id: "mon-route", name: "route", class: "input mono", required: true });
  const form = el("form", { id: "mon-form" }, [
    el("div", { class: "field" }, [el("label", { class: "field-label", for: "mon-route" }, ["Ruta de la API"]), routeSelect]),
    el("div", { class: "field" }, [
      el("label", { class: "field-label", for: "mon-name" }, ["Nombre"]),
      el("input", { id: "mon-name", name: "name", class: "input", required: true, placeholder: "Ej.: Inicio de sesión", autocomplete: "off" }),
    ]),
    el("div", { class: "field" }, [
      el("label", { class: "field-label", for: "mon-description" }, ["Descripción"]),
      el("input", { id: "mon-description", name: "description", class: "input", placeholder: "Opcional", autocomplete: "off" }),
    ]),
  ]);
  const saveButton = el("button", { type: "submit", form: "mon-form", class: "btn btn-primary" }, ["Monitorear"]);
  const modal = createModal({
    title: "Agregar endpoint al monitoreo",
    body: form,
    footer: [el("button", { type: "button", class: "btn btn-secondary", onclick: () => modal.close() }, ["Cancelar"]), saveButton],
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const { route, name, description } = Object.fromEntries(new FormData(form));
    const [method, path] = route.split(" ");
    handlers.onSave({ method, path, name, description });
  });

  // ---- Drawer de detalle ----
  const drawer = detailDrawer({ title: "Detalle del endpoint" });
  const backButton = (endpoint) => el("button", { type: "button", class: "btn btn-secondary", onclick: () => handlers.onSelect(endpoint) }, ["Volver al endpoint"]);

  function endpointContent(ep) {
    const stats = ep.stats || {};
    const recent = ep.recentRequests || [];
    const list = descriptionList([
      { label: "Nombre", value: ep.name },
      { label: "Descripción", value: ep.description },
      { label: "Estado", value: el("span", { class: "row", style: "flex-wrap:nowrap" }, [statusDot(ep.status), el("span", {}, [STATUS_LABEL[ep.status] || ep.status])]) },
      { label: "Método", value: methodBadge(ep.method) },
      { label: "Ruta", value: el("span", { class: "mono" }, [ep.path]) },
      { label: "Peticiones", value: formatNumber(stats.requests ?? 0) },
      { label: "Errores", value: `${formatNumber(stats.errors ?? 0)} (${formatNumber(rateOf(stats) * 100, { maximumFractionDigits: 1 })} %)` },
      { label: "Latencia media", value: stats.requests ? `${formatNumber(stats.avgLatencyMs)} ms` : "—" },
      { label: "Última petición", value: stats.lastRequestAt ? formatDate(stats.lastRequestAt) : "—" },
      { label: "Agregado", value: formatDate(ep.createdAt) },
    ]);
    // Peticiones recientes: el admin puede abrir cada una.
    const onClick = canManage ? { onRowClick: (row) => handlers.onSelectRequest(row) } : {};
    const table = dataTable({
      columns: [
        { key: "statusCode", label: "Estado", render: (r) => statusCodeBadge(r.statusCode) },
        { key: "latencyMs", label: "Latencia", align: "right", render: (r) => `${formatNumber(r.latencyMs)} ms` },
        { key: "createdAt", label: "Fecha", render: (r) => el("span", { class: "muted small" }, [formatDate(r.createdAt)]) },
      ],
      rows: recent,
      empty: el("p", { class: "muted small" }, ["Sin peticiones recientes."]),
      ...onClick,
    });
    return el("div", { class: "stack" }, [list, el("h3", {}, ["Peticiones recientes"]), canManage && recent.length ? el("p", { class: "muted small" }, ["Toca una para ver su detalle."]) : null, table]);
  }

  const actions = [el("button", { type: "button", class: "btn btn-secondary", onclick: handlers.onRefresh }, [icon("refresh"), "Actualizar"])];
  if (canManage) actions.push(el("button", { type: "button", class: "btn btn-primary", onclick: handlers.onOpenForm }, [icon("plus"), "Agregar endpoint"]));

  container.replaceChildren(
    pageHeader({ title: "Monitoreo", subtitle: "Peticiones, errores y latencia de los endpoints vigilados", actions }),
    el("div", { class: "grid-kpi" }, Object.values(kpis)),
    tableCard,
    modal.element
  );

  const columns = [
    {
      key: "status", label: "Estado",
      render: (ep) => el("span", { class: "row", style: "flex-wrap:nowrap;white-space:nowrap" }, [statusDot(ep.status), el("span", {}, [STATUS_LABEL[ep.status] || ep.status])]),
    },
    {
      key: "name", label: "Endpoint",
      render: (ep) => el("div", {}, [el("div", { class: "user-cell-name" }, [ep.name]), ep.description ? el("div", { class: "user-cell-sub" }, [ep.description]) : null]),
    },
    { key: "method", label: "Método", render: (ep) => methodBadge(ep.method) },
    { key: "path", label: "Ruta", render: (ep) => el("span", { class: "mono", style: "white-space:nowrap" }, [ep.path]) },
    { key: "requests", label: "Peticiones", align: "right", render: (ep) => formatNumber(ep.stats.requests) },
    { key: "errors", label: "Errores", render: (ep) => errorsCell(ep.stats) },
    { key: "latency", label: "Latencia", align: "right", render: (ep) => (ep.stats.requests ? `${formatNumber(ep.stats.avgLatencyMs)} ms` : "—") },
    { key: "last", label: "Última", render: (ep) => el("span", { class: "muted small" }, [formatRelative(ep.stats.lastRequestAt)]) },
  ];
  if (canManage) {
    columns.push({
      key: "actions", label: "Quitar", align: "right",
      render: (ep) => el("button", { type: "button", class: "btn btn-ghost btn-icon", title: "Quitar del monitoreo", "aria-label": `Quitar ${ep.name}`, onclick: () => handlers.onDelete(ep) }, [icon("trash")]),
    });
  }

  return {
    showLoading() {
      tableCard.replaceChildren(skeleton(5));
    },

    showEndpoints(endpoints) {
      const count = (status) => endpoints.filter((e) => e.status === status).length;
      kpis.total.setValue(formatNumber(endpoints.length), "endpoints vigilados");
      kpis.healthy.setValue(formatNumber(count("healthy")), "tasa de error menor a 20 %");
      kpis.failing.setValue(formatNumber(count("failing")), "20 % o más con error");
      kpis.idle.setValue(formatNumber(count("no-traffic")), "sin peticiones aún");

      if (!endpoints.length) {
        tableCard.replaceChildren(emptyState({
          icon: "link",
          title: "Sin endpoints monitoreados",
          text: canManage ? "Agrega una ruta de la API para empezar a vigilarla." : "Un administrador aún no ha agregado endpoints.",
          action: canManage ? { label: "Agregar endpoint", icon: "plus", onClick: handlers.onOpenForm } : null,
        }));
        return;
      }
      tableCard.replaceChildren(dataTable({ columns, rows: endpoints, onRowClick: handlers.onSelect }));
    },

    showDetailLoading() {
      drawer.setTitle("Detalle del endpoint");
      drawer.showLoading();
    },

    showEndpointDetail(ep) {
      drawer.setTitle(ep.name || "Detalle del endpoint");
      const buttons = [];
      if (canManage) buttons.push(el("button", { type: "button", class: "btn btn-danger", onclick: () => handlers.onDelete(ep) }, [icon("trash"), "Quitar"]));
      drawer.open(endpointContent(ep), buttons);
    },

    showRequestDetail(log, endpoint) {
      drawer.setTitle("Detalle de la petición");
      drawer.open(requestDetailContent(log), [backButton(endpoint)]);
    },

    closeDetail() {
      drawer.close();
    },

    showError() {
      tableCard.replaceChildren(errorState({ text: "No se pudo cargar el monitoreo.", onRetry: handlers.onRefresh }));
    },

    // routes: rutas de la API que todavía no se monitorean.
    openForm(routes) {
      routeSelect.replaceChildren(...routes.map(({ method, path }) =>
        el("option", { value: `${method} ${path}` }, [`${method} ${path}`])));
      form.reset();
      this.setSaving(false);
      modal.open();
    },

    setSaving(saving) {
      saveButton.classList.toggle("is-loading", saving);
      saveButton.disabled = saving;
    },

    closeForm() {
      form.reset();
      modal.close();
    },
  };
}
