// Controlador de #/activity (solo administradores): consola en vivo del stream, ping e historial paginado.
import { renderActivityView } from "../vistas/actividad.js";
import { stream } from "../modelos/eventos.js";
import { metricApi } from "../modelos/api.js";
import { toast, exportToCsv } from "../utilidades.js";

const PAGE_SIZE = 20;
const CSV_COLUMNS = [
  ["method", "método"], ["path", "ruta"], ["statusCode", "estado"], ["latencyMs", "latencia_ms"], ["createdAt", "fecha"],
];

export function showActivity(container) {
  let paused = false;
  let filters = { statusClass: "", method: "" };
  let currentPage = 1;
  let pageRows = [];
  let request = 0; // para ignorar respuestas viejas del historial
  let active = true;
  let ticket = 0; // ignora respuestas viejas del detalle

  function refreshKpis() {
    const state = stream.getState();
    view.setConnection(state.status);
    view.setReceived(state.count);
    view.setLastEvent(state.lastEvent);
    view.setLatency(state.latencyMs);
  }

  async function loadHistory(page = currentPage) {
    const current = ++request;
    view.showHistoryLoading();
    try {
      const { data, meta } = await metricApi.listRequests({ page, limit: PAGE_SIZE, ...filters });
      if (!active || current !== request) return;
      currentPage = meta.page;
      pageRows = data;
      view.showHistory(data, meta);
    } catch (error) {
      if (!active || current !== request) return;
      view.showHistoryError();
      toast.error(error.message);
    }
  }

  const view = renderActivityView(container, {
    async onSelectRequest(row) {
      if (!row.id) return;
      const mine = ++ticket;
      view.showRequestLoading();
      try {
        const log = await metricApi.getRequest(row.id);
        if (active && mine === ticket) view.showRequestDetail(log);
      } catch (error) {
        if (mine !== ticket) return;
        view.closeRequestDetail();
        toast.error(error.message);
      }
    },
    async onPing() {
      view.setPinging(true);
      try {
        await stream.ping(); // el modelo emite stream:pong y el oyente actualiza la pantalla
      } catch (error) {
        toast.error(error.message);
      } finally {
        view.setPinging(false);
      }
    },
    onReconnect() {
      stream.reconnect();
    },
    onTogglePause() {
      paused = !paused;
      view.setPaused(paused);
    },
    onClear() {
      view.log.clear();
    },
    onFilterChange(next) {
      filters = next;
      loadHistory(1);
    },
    onPageChange(page) {
      loadHistory(page);
    },
    onExportPage() {
      if (!pageRows.length) { toast.info("No hay peticiones para exportar"); return; }
      exportToCsv(pageRows, `axon-peticiones-p${currentPage}.csv`, CSV_COLUMNS);
      toast.success(`Se exportaron ${pageRows.length} peticiones de la página ${currentPage}`);
    },
    onRetryHistory() {
      loadHistory();
    },
  });

  const unsubscribe = stream.subscribe((event) => {
    if (event.name !== "stream:status" && !paused) view.addEvent(event);
    refreshKpis();
  });

  refreshKpis();
  loadHistory(1);

  return () => {
    active = false;
    unsubscribe();
    view.closeRequestDetail();
  };
}
