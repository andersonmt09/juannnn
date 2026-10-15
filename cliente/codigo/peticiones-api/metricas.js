// Llamadas a /api/metrics
import { http } from "./cliente-http.js";

export const metricApi = {
  getDashboard: () => http.get("/metrics/dashboard").then((res) => res.data),
};
