// Servicio de usuarios: llamadas a /api/users
import { http } from "./cliente-http.js";

export const userService = {
  // Devuelve { data, meta: { total, page, limit, totalPages } }
  list: (page = 1, limit = 20) => http.get(`/users?page=${page}&limit=${limit}`),
  create: (data) => http.post("/users", data).then((res) => res.data),
  update: (id, data) => http.put(`/users/${id}`, data).then((res) => res.data),
  changePassword: (id, password, currentPassword) => http.patch(`/users/${id}/password`, { password, currentPassword }),
  remove: (id) => http.delete(`/users/${id}`),

  // Todos los usuarios (recorre todas las páginas), para exportar a CSV.
  async listAll() {
    const all = [];
    for (let page = 1, totalPages = 1; page <= totalPages; page++) {
      const { data, meta } = await http.get(`/users?page=${page}&limit=100`);
      all.push(...data);
      totalPages = meta.totalPages;
    }
    return all;
  },
};
