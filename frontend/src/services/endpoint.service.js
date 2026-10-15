/** SERVICIO: llamadas a /api/endpoints. */
import { http } from "./http.client.js";

export const endpointService = {
  list: () => http.get("/endpoints").then((r) => r.data),              // RF-12
  create: (data) => http.post("/endpoints", data).then((r) => r.data), // RF-13
  remove: (id) => http.delete(`/endpoints/${id}`),                     // RF-13
};
