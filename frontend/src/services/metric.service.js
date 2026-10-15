/** SERVICIO: llamadas a /api/metrics. */
import { http } from "./http.client.js";

export const metricService = {
  getDashboard: () => http.get("/metrics/dashboard").then((r) => r.data), // RF-11
};
