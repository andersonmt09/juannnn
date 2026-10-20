// Llamadas a /api/users
import { http } from "../configuracion/cliente-http.js";

export const userApi = {
  list: () => http.get("/users").then((res) => res.data),
  create: (data) => http.post("/users", data).then((res) => res.data),
  update: (id, data) => http.put(`/users/${id}`, data).then((res) => res.data),
  changePassword: (id, password) => http.patch(`/users/${id}/password`, { password }),
  remove: (id) => http.delete(`/users/${id}`),
};
