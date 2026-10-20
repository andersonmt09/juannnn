// Llamadas a /api/endpoints
import { http } from "../configuracion/cliente-http.js";

export const endpointApi = {
  list: () => http.get("/endpoints").then((res) => res.data),
  create: (data) => http.post("/endpoints", data).then((res) => res.data),
  remove: (id) => http.delete(`/endpoints/${id}`),
};
