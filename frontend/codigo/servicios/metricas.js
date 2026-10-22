// Servicio de métricas: llamadas a /api/metrics
import { http } from "./cliente-http.js";

export const metricService = {
  getDashboard: () => http.get("/metrics/dashboard").then((res) => res.data),
};
