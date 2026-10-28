// Controlador de #/users (solo administradores): listar por páginas, crear, editar, eliminar y exportar usuarios.
import { renderUsersView } from "../vistas/usuarios.js";
import { confirmDialog } from "../vistas/componentes.js";
import { http } from "../modelos/api.js";
import { ListUsersRequestDto, CreateUserRequestDto, UpdateUserRequestDto, ChangePasswordRequestDto } from "../vistas/dto.js";
import { session } from "../modelos/sesion.js";
import { toast, exportToCsv } from "../utilidades.js";

// ---------- Endpoints ----------
// GET    /users?page&limit      (admin) devuelve { data, meta: { total, page, limit, totalPages } }
// GET    /users/:id             (con sesión)
// POST   /users                 (admin)
// PUT    /users/:id             (admin)
// PATCH  /users/:id/password    (con sesión; también lo usa perfil)
// DELETE /users/:id             (admin)
const listUsers = (dto) => http.get(`/users${dto.toQuery()}`);
export const getUser = (id) => http.get(`/users/${id}`).then((res) => res.data);
const createUser = (dto) => http.post("/users", dto).then((res) => res.data);
const updateUser = (id, dto) => http.put(`/users/${id}`, dto).then((res) => res.data);
// Si es la contraseña propia, la respuesta trae una sesión nueva { accessToken, refreshToken, user }.
export const changePassword = (id, dto) => http.patch(`/users/${id}/password`, dto);
const removeUser = (id) => http.delete(`/users/${id}`);

// Todos los usuarios (recorre todas las páginas), para exportar a CSV.
async function listAllUsers() {
  const all = [];
  for (let page = 1, totalPages = 1; page <= totalPages; page++) {
    const { data, meta } = await listUsers(new ListUsersRequestDto({ page, limit: 100 }));
    all.push(...data);
    totalPages = meta.totalPages;
  }
  return all;
}

const PAGE_SIZE = 20;
const CSV_COLUMNS = [
  ["id", "id"], ["name", "nombre"], ["email", "correo"], ["role", "rol"],
  ["emailVerified", "verificado"], ["createdDate", "creado"],
];

export async function showUsers(container) {
  const currentUserId = session.getUser()?.id;
  let currentPage = 1;
  let editingUser = null;
  let active = true;
  let ticket = 0; // ignora respuestas viejas del detalle

  async function loadUsers(page = currentPage) {
    try {
      const { data, meta } = await listUsers(new ListUsersRequestDto({ page, limit: PAGE_SIZE }));
      if (!active) return;
      // Si se eliminó el último de una página, vuelve a la anterior.
      if (!data.length && page > 1) return loadUsers(page - 1);
      currentPage = meta.page;
      view.showUsers(data, meta, currentUserId);
    } catch (error) {
      if (!active) return;
      view.showError();
      toast.error(error.message);
    }
  }

  async function save({ name, email, role, password }) {
    if (!editingUser) {
      await createUser(new CreateUserRequestDto({ name, email, role, password }));
      toast.success("Usuario creado");
      return;
    }
    const isSelf = editingUser.id === currentUserId;
    // El rol propio no se cambia: no se envía.
    await updateUser(editingUser.id, new UpdateUserRequestDto({ name, email, role: isSelf ? undefined : role }));
    if (password && !isSelf) await changePassword(editingUser.id, new ChangePasswordRequestDto({ password }));
    toast.success("Usuario actualizado");
  }

  const view = renderUsersView(container, {
    onNew() {
      editingUser = null;
      view.openForm();
    },
    async onSelect(user) {
      const mine = ++ticket;
      view.showDetailLoading();
      try {
        const detail = await getUser(user.id);
        if (!active || mine !== ticket) return;
        view.showUserDetail(detail, { isSelf: detail.id === currentUserId });
      } catch (error) {
        if (mine !== ticket) return;
        view.closeDetail();
        toast.error(error.message);
      }
    },
    onEdit(user) {
      ticket++;
      view.closeDetail();
      editingUser = user;
      view.openForm(user, { isSelf: user.id === currentUserId });
    },
    async onSave(data) {
      view.setSaving(true);
      try {
        await save(data);
        view.closeForm();
        await loadUsers();
      } catch (error) {
        toast.error(error.message);
      } finally {
        view.setSaving(false);
      }
    },
    async onDelete(user) {
      const confirmed = await confirmDialog({
        title: "Eliminar usuario",
        message: `¿Eliminar a ${user.name}? Es una eliminación lógica: la cuenta dejará de poder iniciar sesión.`,
        confirmLabel: "Eliminar",
      });
      if (!confirmed) return;
      try {
        await removeUser(user.id);
        ticket++;
        view.closeDetail();
        toast.success("Usuario eliminado");
        await loadUsers();
      } catch (error) {
        toast.error(error.message);
      }
    },
    onPageChange(page) {
      loadUsers(page);
    },
    async onExport() {
      try {
        const users = await listAllUsers();
        exportToCsv(users, "axon-usuarios.csv", CSV_COLUMNS);
        toast.success(`Se exportaron ${users.length} usuarios a CSV`);
      } catch (error) {
        toast.error(error.message);
      }
    },
    onRetry() {
      view.showLoading();
      loadUsers();
    },
  });

  await loadUsers();
  return () => { active = false; view.closeDetail(); };
}
