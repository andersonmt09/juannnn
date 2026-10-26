// Controlador de #/users (solo administradores): listar por páginas, crear, editar, eliminar y exportar usuarios.
import { renderUsersView } from "../vistas/usuarios.js";
import { confirmDialog } from "../vistas/componentes.js";
import { userApi } from "../modelos/api.js";
import { session } from "../modelos/sesion.js";
import { toast, exportToCsv } from "../utilidades.js";

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
      const { data, meta } = await userApi.list(page, PAGE_SIZE);
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
      await userApi.create({ name, email, role, password });
      toast.success("Usuario creado");
      return;
    }
    const isSelf = editingUser.id === currentUserId;
    // El rol propio no se cambia: no se envía.
    await userApi.update(editingUser.id, isSelf ? { name, email } : { name, email, role });
    if (password && !isSelf) await userApi.changePassword(editingUser.id, password);
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
        const detail = await userApi.get(user.id);
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
        await userApi.remove(user.id);
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
        const users = await userApi.listAll();
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
