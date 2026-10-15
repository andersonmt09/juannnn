/** SERVICIO: llamadas a /api/users. */
import { http } from "./http.client.js";

export const userService = {
  list: () => http.get("/users").then((r) => r.data),                                  // RF-06
  create: (data) => http.post("/users", data).then((r) => r.data),                     // RF-07
  update: (id, data) => http.put(`/users/${id}`, data).then((r) => r.data),            // RF-08
  changePassword: (id, password) => http.patch(`/users/${id}/password`, { password }), // RF-09
  remove: (id) => http.delete(`/users/${id}`),                                         // RF-10
};
