import { createDashboardView } from "../vistas/panel.js";
import { http } from "../modelos/api.js";
import { RunSimulationRequestDto } from "../dto/simulacion.js";
import { RequestLogIdRequestDto } from "../dto/metricas.js";
import { stream } from "../modelos/eventos.js";
import { session } from "../modelos/sesion.js";
import { toast, exportToCsv } from "../utilidades.js";

// endpoints
export const getDashboard = () => http.get("/metrics/dashboard").then((res) => res.data);
export const getServices = () => http.get("/metrics/services").then((res) => res.data);
export const getRequest = (dto) => http.get(`/metrics/requests/${dto.id}`).then((res) => res.data);

// con la BD caída el backend responde 503 con cuerpo útil
export async function getHealth() {
  try {
    return await http.get("/health");
  } catch (error) {
    if (error.data?.status) return error.data;
    throw error;
  }
}

const runSimulation = (dto) => http.post("/simulations", dto);

// la capa Cliente es el tiempo total menos el del servidor
function withClientLayer(result, totalMs) {
  const layers = result.layers.map((layer) => ({ ...layer }));
  layers[0].durationMs = Math.max(0, totalMs - result.totalMs);
  return { ...result, layers, totalMs };
}

const CSV_COLUMNS = [
  ["method", "metodo"], ["path", "ruta"], ["statusCode", "estado"],
  ["latencyMs", "latencia_ms"], ["createdAt", "fecha"],
];
const MAX_RECENT = 10;
const DEBOUNCE_MS = 2000; // espera entre eventos antes de recargar

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
        const log = await getRequest(new RequestLogIdRequestDto({ id: row.id }));
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
      const [data, services] = await Promise.all([getDashboard(), getServices()]);
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

  view.bindSimulation(async ({ operation, forceError }) => {
    view.setRunning(true);
    const started = performance.now();
    try {
      const result = await runSimulation(new RunSimulationRequestDto({ operation, forceError }));
      const totalMs = performance.now() - started;
      toast.success(`Simulación completada en ${Math.round(totalMs)} ms`);
      view.setRunning(false);
      await view.playSimulation(withClientLayer(result, totalMs));
    } catch (error) {
      view.setRunning(false);
      toast.error(`Error ${error.status || ""}: ${error.message}`.replace("Error : ", "Error: "));
      await view.playSimulation({ failed: true, message: error.message, totalMs: performance.now() - started });
    }
  });

  async function softReload() {
    if (!alive || loading) return;
    try {
      const data = await getDashboard();
      if (!alive) return;
      recent = [...data.recentRequests];
      view.refreshData({ dashboard: data, recent });
      view.setUpdatedAt(new Date());
    } catch { /* el próximo evento lo intenta de nuevo */ }
  }

  const unsubscribe = stream.subscribe((event) => {
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
