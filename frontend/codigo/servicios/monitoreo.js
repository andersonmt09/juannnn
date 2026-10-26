// Servicio de monitoreo: llamadas a /api/monitoring
import { http } from "./cliente-http.js";

export const monitoringService = {
  listEndpoints: () => http.get("/monitoring/endpoints").then((res) => res.data),
  listApiRoutes: () => http.get("/monitoring/routes").then((res) => res.data),
  addEndpoint: (data) => http.post("/monitoring/endpoints", data).then((res) => res.data),
  removeEndpoint: (id) => http.delete(`/monitoring/endpoints/${id}`),
};
