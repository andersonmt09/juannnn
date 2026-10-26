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
const DEBOUNCE_MS = 2000; // espera entre eventos antes de recargar las métricas

export function showDashboard(container) {
  let alive = true;
  let loaded = false;
  let debounceTimer = null;
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
      recent = [...data.recentRequests];
      view.showData({ dashboard: data, services, recent });
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

  // Simulación: se mide el tiempo total y el modelo calcula la capa Cliente.
  view.bindSimulation(async ({ operation, forceError }) => {
    view.setRunning(true);
    const started = performance.now();
    try {
      const result = await simulationApi.run({ operation, forceError });
      const totalMs = performance.now() - started;
      toast.success(`Simulación completada en ${Math.round(totalMs)} ms`);
      view.setRunning(false);
      await view.playSimulation(simulationApi.withClientLayer(result, totalMs));
    } catch (error) {
      view.setRunning(false);
      toast.error(`Error ${error.status || ""}: ${error.message}`.replace("Error : ", "Error: "));
      await view.playSimulation({ failed: true, message: error.message, totalMs: performance.now() - started });
    }
  });

  // Recarga suave del panel: el servidor calcula las métricas, el cliente solo las muestra.
  async function softReload() {
    if (!alive || loading) return;
    try {
      const data = await metricApi.getDashboard();
      if (!alive) return;
      recent = [...data.recentRequests];
      view.refreshData({ dashboard: data, recent });
      view.setUpdatedAt(new Date());
    } catch { /* el próximo evento lo intenta de nuevo */ }
  }

  // Cada api:activity agrega la fila a la tabla y pide métricas nuevas con debounce.
  const unsubscribe = stream.subscribe((event) => {
    // Al conectarse el tiempo real, se recarga para que los servicios cuenten este cliente.
    if (event.name === "stream:connected") {
      if (loading) reloadAfterLoad = true; else load();
      return;
    }
    if (event.name !== "api:activity" || !loaded || !event.data) return;
    recent = [event.data, ...recent].slice(0, MAX_RECENT);
    view.showRecent(recent);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(softReload, DEBOUNCE_MS);
  });

  load();

  return () => {
    alive = false;
    clearTimeout(debounceTimer);
    unsubscribe();
    view.destroy();
  };
}
