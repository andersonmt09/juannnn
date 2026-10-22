// Controlador de #/users (solo administradores): listar, crear, editar, eliminar y exportar usuarios.
import { renderUsersView } from "../vistas/usuarios.js";
import { userService } from "../servicios/usuarios.js";
import { session } from "../modelos/sesion.js";
import { toast } from "../utilidades/notificaciones.js";
import { exportToCsv } from "../utilidades/csv.js";

const CSV_COLUMNS = [
  ["id", "id"], ["name", "nombre"], ["email", "correo"], ["role", "rol"],
  ["emailVerified", "verificado"], ["createdDate", "creado"],
];

export async function showUsers(container) {
  let users = [];
  let editingUser = null;

  async function loadUsers() {
    try {
      users = await userService.list();
      view.showUsers(users, session.getUser()?.id);
    } catch (error) {
      view.showError();
      toast.error(error.message);
    }
  }

  async function save({ name, email, role, password }) {
    if (editingUser) {
      await userService.update(editingUser.id, { name, email, role });
      if (password) await userService.changePassword(editingUser.id, password);
      toast.success("Usuario actualizado");
    } else {
      await userService.create({ name, email, role, password });
      toast.success("Usuario creado");
    }
  }

  const view = renderUsersView(container, {
    onNew() {
      editingUser = null;
      view.openForm();
    },
    onEdit(user) {
      editingUser = user;
      view.openForm(user);
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
    onExport() {
      exportToCsv(users, "axon-usuarios.csv", CSV_COLUMNS);
    },
  });

  await loadUsers();
}
