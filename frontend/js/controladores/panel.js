// Controlador de #/dashboard: carga métricas y servicios, corre simulaciones y sigue el stream en vivo.
import { createDashboardView } from "../vistas/panel.js";
import { metricApi, simulationApi } from "../modelos/api.js";
import { stream } from "../modelos/eventos.js";
import { session } from "../modelos/sesion.js";
import { toast, exportToCsv } from "../utilidades.js";

const CSV_COLUMNS = [
  ["method", "metodo"], ["path", "ruta"], ["statusCode", "estado"],
  ["latencyMs", "latencia_ms"], ["createdAt", "fecha"],
];
const MAX_RECENT = 10;

export function showDashboard(container) {
  let alive = true;
  let loaded = false;
  let dashboard = null; // datos vigentes (se modifican con el stream)
  let recent = [];
  let ticket = 0; // ignora respuestas viejas del detalle

  const view = createDashboardView(container, { userName: session.getUser()?.name }, {
    async onSelectRequest(row) {
      if (!row.id) return;
      const mine = ++ticket;
      view.showRequestLoading();
      try {
        const log = await metricApi.getRequest(row.id);
        if (alive && mine === ticket) view.showRequestDetail(log);
      } catch (error) {
        if (mine !== ticket) return;
        view.closeRequestDetail();
        toast.error(error.message);
      }
    },
    onRefresh: () => load(),
    onExport: () => {
      if (!recent.length) { toast.info("No hay actividad para exportar"); return; }
      exportToCsv(recent, "axon-actividad.csv", CSV_COLUMNS);
      toast.success("Archivo CSV exportado");
    },
  });

  let loading = false;
  let reloadAfterLoad = false;

  async function load() {
    loading = true;
    if (loaded) view.setRefreshing(true); else view.showLoading();
    try {
      const [data, services] = await Promise.all([metricApi.getDashboard(), metricApi.getServices()]);
      if (!alive) return;
      dashboard = data;
      recent = [...data.recentRequests];
      view.showData({ dashboard, services, recent });
      view.setUpdatedAt(new Date());
      loaded = true;
    } catch (error) {
      if (!alive) return;
      if (!loaded) view.showError(() => load());
      toast.error(error.message);
    } finally {
      loading = false;
      if (alive) view.setRefreshing(false);
      if (alive && reloadAfterLoad) { reloadAfterLoad = false; load(); }
    }
  }

  // Simulación: se mide el tiempo total y cliente = total − servidor.
  view.bindSimulation(async ({ operation, forceError }) => {
    view.setRunning(true);
    const started = performance.now();
    try {
      const result = await simulationApi.run({ operation, forceError });
      const totalMs = performance.now() - started;
      const layers = result.layers.map((layer) => ({ ...layer }));
      layers[0].durationMs = Math.max(0, totalMs - result.totalMs);
      toast.success(`Simulación completada en ${Math.round(totalMs)} ms`);
      view.setRunning(false);
      await view.playSimulation({ ...result, layers, totalMs });
    } catch (error) {
      view.setRunning(false);
      toast.error(`Error ${error.status || ""}: ${error.message}`.replace("Error : ", "Error: "));
      await view.playSimulation({ failed: true, message: error.message, totalMs: performance.now() - started });
    }
  });

  // Cada api:activity suma a los KPI y a la tabla sin recargar.
  const unsubscribe = stream.subscribe((event) => {
    // Al conectarse el tiempo real, se recarga para que los servicios cuenten este cliente.
    if (event.name === "stream:connected") {
      if (loading) reloadAfterLoad = true; else load();
      return;
    }
    if (event.name !== "api:activity" || !dashboard || !event.data) return;
    const s = dashboard.summary;
    const hit = event.data;
    s.avgLatencyMs = (s.avgLatencyMs * s.requestsTotal + hit.latencyMs) / (s.requestsTotal + 1);
    s.requestsTotal += 1;
    s.requestsLast24h += 1;
    if (hit.statusCode >= 400) s.errorsTotal += 1;
    s.errorRate = s.errorsTotal / s.requestsTotal;
    recent = [hit, ...recent].slice(0, MAX_RECENT);
    view.update(s, recent);
  });

  load();

  return () => {
    alive = false;
    unsubscribe();
    view.destroy();
  };
}
