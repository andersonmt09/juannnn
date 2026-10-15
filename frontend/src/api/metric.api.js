// Llamadas a /api/metrics
import { http } from "./http-client.js";

export const metricApi = {
  getDashboard: () => http.get("/metrics/dashboard").then((res) => res.data),
};
