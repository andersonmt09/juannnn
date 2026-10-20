// Vista #/users (solo administradores): listar, crear, editar, eliminar y exportar.
import { el } from "../utilidades/dom.js";
import { toast } from "../utilidades/notificaciones.js";
import { exportToCsv } from "../utilidades/csv.js";
import { userApi } from "../servicios-api/usuarios.js";
import { session } from "../estado/sesion.js";
import { pageHeader } from "../componentes/encabezado.js";
import { createModal } from "../componentes/modal.js";
import { emptyState } from "../componentes/estado-vacio.js";

export async function renderUsersView(container) {
  if (!session.isAdmin()) {
    container.replaceChildren(pageHeader("Usuarios"), el("p", { class: "muted" }, ["Acceso restringido a administradores."]));
    return;
  }

  let users = [];
  let editingUser = null;
  const tablePanel = el("div", { class: "panel" }, [el("p", { class: "muted" }, ["Cargando..."])]);

  // Formulario (crear / editar)
  const passwordLabel = el("label", { for: "user-password" }, ["Contraseña"]);
  const form = el("form", {}, [
    el("label", { for: "user-name" }, ["Nombre"]),
    el("input", { id: "user-name", name: "name", required: true, minlength: "2" }),
    el("label", { for: "user-email" }, ["Correo"]),
    el("input", { id: "user-email", name: "email", type: "email", required: true }),
    el("label", { for: "user-role" }, ["Rol"]),
    el("select", { id: "user-role", name: "role" }, [
      el("option", { value: "user" }, ["Usuario"]),
      el("option", { value: "admin" }, ["Administrador"]),
    ]),
    passwordLabel,
    el("input", { id: "user-password", name: "password", type: "password", minlength: "6" }),
    el("div", { class: "row" }, [
      el("button", { type: "submit", class: "btn btn-primary" }, ["Guardar"]),
      el("button", { type: "button", class: "btn", onclick: () => modal.close() }, ["Cancelar"]),
    ]),
  ]);
  const modal = createModal("Usuario", form);

  function openForm(user = null) {
    editingUser = user;
    modal.setTitle(user ? "Editar usuario" : "Nuevo usuario");
    form.reset();
    form.elements.name.value = user?.name || "";
    form.elements.email.value = user?.email || "";
    form.elements.role.value = user?.role || "user";
    form.elements.password.required = !user;
    passwordLabel.textContent = user ? "Nueva contraseña (opcional)" : "Contraseña";
    modal.open();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const { name, email, role, password } = Object.fromEntries(new FormData(form));
    try {
      if (editingUser) {
        await userApi.update(editingUser.id, { name, email, role });
        if (password) await userApi.changePassword(editingUser.id, password);
        toast.success("Usuario actualizado");
      } else {
        await userApi.create({ name, email, role, password });
        toast.success("Usuario creado");
      }
      modal.close();
      await loadUsers();
    } catch (error) {
      toast.error(error.message);
    }
  });

  // Tabla
  async function removeUser(user) {
    if (!confirm(`¿Eliminar a ${user.name}? (eliminación lógica)`)) return;
    try {
      await userApi.remove(user.id);
      toast.success("Usuario eliminado");
      await loadUsers();
    } catch (error) {
      toast.error(error.message);
    }
  }

  function renderTable() {
    if (!users.length) {
      tablePanel.replaceChildren(emptyState("Sin usuarios", "Crea el primer usuario."));
      return;
    }
    const currentId = session.getUser()?.id;
    const rows = users.map((u) => el("tr", {}, [
      el("td", {}, [String(u.id)]),
      el("td", {}, [u.name]),
      el("td", {}, [u.email]),
      el("td", {}, [el("span", { class: `badge role-${u.role}` }, [u.role])]),
      el("td", {}, [u.emailVerified ? "Sí" : "No"]),
      el("td", { class: "actions" }, [
        el("button", { class: "btn btn-sm", onclick: () => openForm(u) }, ["Editar"]),
        el("button", {
          class: "btn btn-sm btn-danger",
          disabled: u.id === currentId || u.isSample,
          title: u.isSample ? "Usuario demo protegido" : undefined,
          onclick: () => removeUser(u),
        }, ["Eliminar"]),
      ]),
    ]));
    tablePanel.replaceChildren(el("table", { class: "table" }, [
      el("thead", {}, [el("tr", {}, ["ID", "Nombre", "Correo", "Rol", "Verificado", "Acciones"].map((h) => el("th", {}, [h])))]),
      el("tbody", {}, rows),
    ]));
  }

  async function loadUsers() {
    try {
      users = await userApi.list();
      renderTable();
    } catch (error) {
      tablePanel.replaceChildren(el("p", { class: "muted" }, ["Error al cargar usuarios."]));
      toast.error(error.message);
    }
  }

  const exportButton = el("button", {
    class: "btn",
    onclick: () => exportToCsv(users, "axon-usuarios.csv", [
      ["id", "id"], ["name", "nombre"], ["email", "correo"], ["role", "rol"],
      ["emailVerified", "verificado"], ["createdDate", "creado"],
    ]),
  }, ["Exportar CSV"]);
  const newButton = el("button", { class: "btn btn-primary", onclick: () => openForm() }, ["+ Nuevo usuario"]);

  container.replaceChildren(pageHeader("Usuarios", "Gestión de cuentas y roles", [exportButton, newButton]), tablePanel, modal.element);
  await loadUsers();
}
