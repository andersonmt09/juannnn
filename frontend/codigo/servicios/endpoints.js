// Servicio de endpoints monitoreados: llamadas a /api/endpoints
import { http } from "./cliente-http.js";

export const endpointService = {
  list: () => http.get("/endpoints").then((res) => res.data),
  create: (data) => http.post("/endpoints", data).then((res) => res.data),
  remove: (id) => http.delete(`/endpoints/${id}`),
};
