// Controlador de #/users (solo administradores): listar por páginas, crear, editar, eliminar y exportar usuarios.
import { renderUsersView } from "../vistas/usuarios.js";
import { userService } from "../servicios/usuarios.js";
import { session } from "../modelos/sesion.js";
import { toast } from "../utilidades/notificaciones.js";
import { exportToCsv } from "../utilidades/csv.js";

const PAGE_SIZE = 20;
const CSV_COLUMNS = [
  ["id", "id"], ["name", "nombre"], ["email", "correo"], ["role", "rol"],
  ["emailVerified", "verificado"], ["createdDate", "creado"],
];

export async function showUsers(container) {
  const currentUserId = session.getUser()?.id;
  let currentPage = 1;
  let editingUser = null;

  async function loadUsers(page = currentPage) {
    try {
      const { data, meta } = await userService.list(page, PAGE_SIZE);
      // Si se eliminó el último de una página, vuelve a la anterior.
      if (!data.length && page > 1) return loadUsers(page - 1);
      currentPage = meta.page;
      view.showUsers(data, meta, currentUserId);
    } catch (error) {
      view.showError();
      toast.error(error.message);
    }
  }

  async function save({ name, email, role, password }) {
    if (!editingUser) {
      await userService.create({ name, email, role, password });
      toast.success("Usuario creado");
      return;
    }
    await userService.update(editingUser.id, { name, email, role });
    if (password && editingUser.id !== currentUserId) await userService.changePassword(editingUser.id, password);
    toast.success("Usuario actualizado");
  }

  const view = renderUsersView(container, {
    onNew() {
      editingUser = null;
      view.openForm();
    },
    onEdit(user) {
      editingUser = user;
      view.openForm(user, { isSelf: user.id === currentUserId });
    },
    async onSave(data) {
      try {
        await save(data);
        view.closeForm();
        await loadUsers();
      } catch (error) {
        toast.error(error.message);
      }
    },
    async onDelete(user) {
      if (!confirm(`¿Eliminar a ${user.name}? (eliminación lógica)`)) return;
      try {
        await userService.remove(user.id);
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
        exportToCsv(await userService.listAll(), "axon-usuarios.csv", CSV_COLUMNS);
      } catch (error) {
        toast.error(error.message);
      }
    },
  });

  await loadUsers();
}
