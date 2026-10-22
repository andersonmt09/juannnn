// Vista de gestión de usuarios (#/users). Dibuja la tabla y el formulario; las acciones las decide el controlador.
import { el } from "../utilidades/dom.js";
import { pageHeader } from "../componentes/encabezado.js";
import { createModal } from "../componentes/modal.js";
import { emptyState } from "../componentes/estado-vacio.js";

/**
 * @param {HTMLElement} container
 * @param {{
 *   onNew: () => void,
 *   onEdit: (user: object) => void,
 *   onDelete: (user: object) => void,
 *   onSave: (data: { name: string, email: string, role: string, password: string }) => void,
 *   onExport: () => void,
 * }} handlers
 */
export function renderUsersView(container, handlers) {
  const tablePanel = el("div", { class: "panel" }, [el("p", { class: "muted" }, ["Cargando..."])]);

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

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    handlers.onSave(Object.fromEntries(new FormData(form)));
  });

  container.replaceChildren(
    pageHeader("Usuarios", "Gestión de cuentas y roles", [
      el("button", { class: "btn", onclick: handlers.onExport }, ["Exportar CSV"]),
      el("button", { class: "btn btn-primary", onclick: handlers.onNew }, ["+ Nuevo usuario"]),
    ]),
    tablePanel,
    modal.element
  );

  return {
    showUsers(users, currentUserId) {
      if (!users.length) {
        tablePanel.replaceChildren(emptyState("Sin usuarios", "Crea el primer usuario."));
        return;
      }
      const rows = users.map((u) => el("tr", {}, [
        el("td", {}, [String(u.id)]),
        el("td", {}, [u.name]),
        el("td", {}, [u.email]),
        el("td", {}, [el("span", { class: `badge role-${u.role}` }, [u.role])]),
        el("td", {}, [u.emailVerified ? "Sí" : "No"]),
        el("td", { class: "actions" }, [
          el("button", { class: "btn btn-sm", onclick: () => handlers.onEdit(u) }, ["Editar"]),
          el("button", {
            class: "btn btn-sm btn-danger",
            disabled: u.id === currentUserId || u.isSample,
            title: u.isSample ? "Usuario demo protegido" : undefined,
            onclick: () => handlers.onDelete(u),
          }, ["Eliminar"]),
        ]),
      ]));
      tablePanel.replaceChildren(el("table", { class: "table" }, [
        el("thead", {}, [el("tr", {}, ["ID", "Nombre", "Correo", "Rol", "Verificado", "Acciones"].map((h) => el("th", {}, [h])))]),
        el("tbody", {}, rows),
      ]));
    },

    showError() {
      tablePanel.replaceChildren(el("p", { class: "muted" }, ["Error al cargar usuarios."]));
    },

    openForm(user = null) {
      modal.setTitle(user ? "Editar usuario" : "Nuevo usuario");
      form.reset();
      form.elements.name.value = user?.name || "";
      form.elements.email.value = user?.email || "";
      form.elements.role.value = user?.role || "user";
      form.elements.password.required = !user;
      passwordLabel.textContent = user ? "Nueva contraseña (opcional)" : "Contraseña";
      modal.open();
    },

    closeForm() {
      modal.close();
    },
  };
}
