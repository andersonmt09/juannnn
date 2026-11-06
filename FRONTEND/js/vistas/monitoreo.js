import { pageHeader, emptyState, errorState, skeleton, kpiCard, dataTable, createModal, methodBadge, statusDot, statusCodeBadge, detailDrawer, descriptionList, requestDetailContent, sectionName, sectionCell, ACTION_LABEL } from "./componentes.js";
import { el, icon, formatNumber, formatRelative, formatDate } from "../utilidades.js";

const HIGH_ERROR_RATE = 0.2; // 20 % o más con error = fallando
const STATUS_LABEL = { healthy: "Funciona bien", failing: "Con errores", "no-traffic": "Sin uso" };

const rateOf = ({ requests, errors, errorRate }) => errorRate ?? (requests ? errors / requests : 0);

function errorsCell(stats) {
  const rate = rateOf(stats);
  const tone = rate >= HIGH_ERROR_RATE ? "danger" : rate > 0 ? "warning" : "success";
  const percent = `${formatNumber(rate * 100, { maximumFractionDigits: 1 })} %`;
  return el("div", { class: "rate", style: "white-space:nowrap", title: `${percent} de las solicitudes` }, [
    el("span", { class: "num" }, [formatNumber(stats.errors)]),
    el("div", { class: "rate-bar", "data-tone": tone }, [el("span", { style: `width:${Math.min(100, Math.round(rate * 100))}%` })]),
  ]);
}

export function renderMonitoringView(container, { canManage }, handlers) {
  const kpis = {
    total: kpiCard({ label: "Vigiladas", icon: "link", tone: "accent", loading: true }),
    healthy: kpiCard({ label: "Funcionando bien", icon: "check", tone: "success", loading: true }),
    failing: kpiCard({ label: "Con errores", icon: "alert", tone: "danger", loading: true }),
    idle: kpiCard({ label: "Sin uso", icon: "clock", tone: "warning", loading: true }),
  };
  const tableCard = el("div", { class: "card card-flush" }, [skeleton(5)]);

  const routeSelect = el("select", { id: "mon-route", name: "route", class: "input", required: true });
  const form = el("form", { id: "mon-form" }, [
    el("div", { class: "field" }, [el("label", { class: "field-label", for: "mon-route" }, ["Sección del sistema"]), routeSelect]),
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
    title: "Vigilar una sección",
    body: form,
    footer: [el("button", { type: "button", class: "btn btn-secondary", onclick: () => modal.close() }, ["Cancelar"]), saveButton],
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const { route, name, description } = Object.fromEntries(new FormData(form));
    const [method, path] = route.split(" ");
    handlers.onSave({ method, path, name, description });
  });

  const drawer = detailDrawer({ title: "Detalle de la sección" });
  const backButton = (endpoint) => el("button", { type: "button", class: "btn btn-secondary", onclick: () => handlers.onSelect(endpoint) }, ["Volver a la sección"]);

  function endpointContent(ep) {
    const stats = ep.stats || {};
    const recent = ep.recentRequests || [];
    const list = descriptionList([
      { label: "Nombre", value: ep.name },
      { label: "Descripción", value: ep.description },
      { label: "Estado", value: el("span", { class: "row", style: "flex-wrap:nowrap" }, [statusDot(ep.status), el("span", {}, [STATUS_LABEL[ep.status] || ep.status])]) },
      { label: "Acción", value: methodBadge(ep.method) },
      { label: "Sección", value: sectionName(ep.path) },
      { label: "Solicitudes", value: formatNumber(stats.requests ?? 0) },
      { label: "Errores", value: `${formatNumber(stats.errors ?? 0)} (${formatNumber(rateOf(stats) * 100, { maximumFractionDigits: 1 })} %)` },
      { label: "Tiempo de respuesta promedio", value: stats.requests ? `${formatNumber(stats.avgLatencyMs)} ms` : "—" },
      { label: "Última petición", value: stats.lastRequestAt ? formatDate(stats.lastRequestAt) : "—" },
      { label: "Agregado", value: formatDate(ep.createdAt) },
    ]);
    const onClick = canManage ? { onRowClick: (row) => handlers.onSelectRequest(row) } : {};
    const table = dataTable({
      columns: [
        { key: "statusCode", label: "Resultado", render: (r) => statusCodeBadge(r.statusCode) },
        { key: "latencyMs", label: "Tiempo", align: "right", render: (r) => `${formatNumber(r.latencyMs)} ms` },
        { key: "createdAt", label: "Fecha", render: (r) => el("span", { class: "muted small" }, [formatDate(r.createdAt)]) },
      ],
      rows: recent,
      empty: el("p", { class: "muted small" }, ["Sin solicitudes recientes."]),
      ...onClick,
    });
    return el("div", { class: "stack" }, [list, el("h3", {}, ["Solicitudes recientes"]), canManage && recent.length ? el("p", { class: "muted small" }, ["Toca una para ver su detalle."]) : null, table]);
  }

  const actions = [el("button", { type: "button", class: "btn btn-secondary", onclick: handlers.onRefresh }, [icon("refresh"), "Actualizar"])];
  if (canManage) actions.push(el("button", { type: "button", class: "btn btn-primary", onclick: handlers.onOpenForm }, [icon("plus"), "Vigilar sección"]));

  container.replaceChildren(
    pageHeader({ title: "Secciones vigiladas", subtitle: "Cuántas veces se usa cada sección, cuántas fallan y qué tan rápido responden", actions }),
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
      key: "name", label: "Sección",
      render: (ep) => el("div", {}, [el("div", { class: "user-cell-name" }, [ep.name]), ep.description ? el("div", { class: "user-cell-sub" }, [ep.description]) : null]),
    },
    { key: "method", label: "Acción", render: (ep) => methodBadge(ep.method) },
    { key: "path", label: "Sección", render: (ep) => sectionCell(ep.path) },
    { key: "requests", label: "Solicitudes", align: "right", render: (ep) => formatNumber(ep.stats.requests) },
    { key: "errors", label: "Errores", render: (ep) => errorsCell(ep.stats) },
    { key: "latency", label: "Tiempo", align: "right", render: (ep) => (ep.stats.requests ? `${formatNumber(ep.stats.avgLatencyMs)} ms` : "—") },
    { key: "last", label: "Última", render: (ep) => el("span", { class: "muted small" }, [formatRelative(ep.stats.lastRequestAt)]) },
  ];
  if (canManage) {
    columns.push({
      key: "actions", label: "Quitar", align: "right",
      render: (ep) => el("button", { type: "button", class: "btn btn-ghost btn-icon", title: "Dejar de vigilar", "aria-label": `Quitar ${ep.name}`, onclick: () => handlers.onDelete(ep) }, [icon("trash")]),
    });
  }

  return {
    showLoading() {
      tableCard.replaceChildren(skeleton(5));
    },

    showEndpoints(endpoints) {
      const count = (status) => endpoints.filter((e) => e.status === status).length;
      kpis.total.setValue(formatNumber(endpoints.length), "secciones vigiladas");
      kpis.healthy.setValue(formatNumber(count("healthy")), "tasa de error menor a 20 %");
      kpis.failing.setValue(formatNumber(count("failing")), "20 % o más con error");
      kpis.idle.setValue(formatNumber(count("no-traffic")), "sin solicitudes aún");

      if (!endpoints.length) {
        tableCard.replaceChildren(emptyState({
          icon: "link",
          title: "Todavía no vigilas ninguna sección",
          text: canManage ? "Elige una sección del sistema para empezar a seguir su uso." : "Un administrador aún no ha elegido secciones para vigilar.",
          action: canManage ? { label: "Vigilar sección", icon: "plus", onClick: handlers.onOpenForm } : null,
        }));
        return;
      }
      tableCard.replaceChildren(dataTable({ columns, rows: endpoints, onRowClick: handlers.onSelect }));
    },

    showDetailLoading() {
      drawer.setTitle("Detalle de la sección");
      drawer.showLoading();
    },

    showEndpointDetail(ep) {
      drawer.setTitle(ep.name || "Detalle de la sección");
      const buttons = [];
      if (canManage) buttons.push(el("button", { type: "button", class: "btn btn-danger", onclick: () => handlers.onDelete(ep) }, [icon("trash"), "Quitar"]));
      drawer.open(endpointContent(ep), buttons);
    },

    showRequestDetail(log, endpoint) {
      drawer.setTitle("Detalle de la solicitud");
      drawer.open(requestDetailContent(log), [backButton(endpoint)]);
    },

    closeDetail() {
      drawer.close();
    },

    showError() {
      tableCard.replaceChildren(errorState({ text: "No se pudieron cargar las secciones vigiladas.", onRetry: handlers.onRefresh }));
    },

    openForm(routes) {
      routeSelect.replaceChildren(...routes.map(({ method, path }) =>
        el("option", { value: `${method} ${path}` }, [`${sectionName(path)} · ${ACTION_LABEL[method] || method}`])));
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
