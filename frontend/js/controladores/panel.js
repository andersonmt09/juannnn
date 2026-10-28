// Controlador de #/dashboard: carga métricas y servicios, corre simulaciones y sigue el stream en vivo.
import { createDashboardView } from "../vistas/panel.js";
import { http } from "../modelos/api.js";
import { RunSimulationRequestDto } from "../vistas/dto.js";
import { stream } from "../modelos/eventos.js";
import { session } from "../modelos/sesion.js";
import { toast, exportToCsv } from "../utilidades.js";

// ---------- Endpoints ----------
// GET  /metrics/dashboard   (admin)
// GET  /metrics/services    (admin)
// GET  /metrics/requests/:id (admin) — también lo usan actividad y monitoreo
// GET  /health              (público) — también lo usan inicio de sesión, recuperar contraseña y menú
// POST /simulations         (admin; alias /axonApi)
export const getDashboard = () => http.get("/metrics/dashboard").then((res) => res.data);
export const getServices = () => http.get("/metrics/services").then((res) => res.data);
// Detalle de una petición registrada, con el usuario que la hizo (o null).
export const getRequest = (id) => http.get(`/metrics/requests/${id}`).then((res) => res.data);

// Con la BD caída el backend responde 503 pero con cuerpo útil: se devuelve igual.
export async function getHealth() {
  try {
    return await http.get("/health");
  } catch (error) {
    if (error.data?.status) return error.data;
    throw error;
  }
}

// dto: RunSimulationRequestDto. Devuelve { request, layers, data, totalMs }
const runSimulation = (dto) => http.post("/simulations", dto);

// Medición (no regla de negocio): la capa Cliente es el tiempo total menos el del servidor.
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
        const log = await getRequest(row.id);
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

  // Simulación: se mide el tiempo total y el modelo calcula la capa Cliente.
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

  // Recarga suave del panel: el servidor calcula las métricas, el cliente solo las muestra.
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
