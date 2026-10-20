// Llamadas a /api/metrics
import { http } from "../configuracion/cliente-http.js";

export const metricApi = {
  getDashboard: () => http.get("/metrics/dashboard").then((res) => res.data),
};
