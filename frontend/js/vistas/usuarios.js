import { pageHeader, createModal, emptyState, errorState, dataTable, pagination, badge, skeleton, detailDrawer, descriptionList } from "./componentes.js";
import { el, icon, initials, formatDate, formatNumber } from "../utilidades.js";

const ROLE_LABEL = { admin: "Administrador", user: "Usuario" };

export function renderUsersView(container, handlers) {
  const subtitle = el("span", {}, ["Gestión de cuentas y roles"]);
  const tableCard = el("div", { class: "card" }, [skeleton(5)]);

  const nameInput = el("input", { id: "user-name", name: "name", class: "input", required: true, minlength: "2", maxlength: "100", autocomplete: "off" });
  const emailInput = el("input", { id: "user-email", name: "email", class: "input", type: "email", required: true, autocomplete: "off" });
  const roleSelect = el("select", { id: "user-role", name: "role", class: "input" }, [
    el("option", { value: "user" }, ["Usuario"]),
    el("option", { value: "admin" }, ["Administrador"]),
  ]);
  const roleHint = el("div", { class: "field-hint hidden" }, ["No puedes cambiar tu propio rol"]);
  const passwordLabel = el("label", { class: "field-label", for: "user-password" }, ["Contraseña"]);
  const passwordInput = el("input", { id: "user-password", name: "password", class: "input", type: "password", minlength: "8", maxlength: "72", autocomplete: "new-password" });
  const passwordHint = el("div", { class: "field-hint" }, ["Entre 8 y 72 caracteres"]);
  const passwordField = el("div", { class: "field" }, [passwordLabel, passwordInput, passwordHint]);

  const form = el("form", { id: "user-form" }, [
    el("div", { class: "field" }, [el("label", { class: "field-label", for: "user-name" }, ["Nombre"]), nameInput]),
    el("div", { class: "field" }, [el("label", { class: "field-label", for: "user-email" }, ["Correo"]), emailInput]),
    el("div", { class: "field" }, [el("label", { class: "field-label", for: "user-role" }, ["Rol"]), roleSelect, roleHint]),
    passwordField,
  ]);
  const saveButton = el("button", { type: "submit", form: "user-form", class: "btn btn-primary" }, ["Guardar"]);
  const modal = createModal({
    title: "Usuario",
    body: form,
    footer: [el("button", { type: "button", class: "btn btn-secondary", onclick: () => modal.close() }, ["Cancelar"]), saveButton],
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    // con el select deshabilitado FormData omite el rol
    handlers.onSave({ ...Object.fromEntries(new FormData(form)), role: roleSelect.value });
  });

  const drawer = detailDrawer({ title: "Detalle del usuario" });

  container.replaceChildren(
    pageHeader({
      title: "Usuarios",
      subtitle,
      actions: [
        el("button", { type: "button", class: "btn btn-secondary", onclick: handlers.onExport }, [icon("download"), "Exportar CSV"]),
        el("button", { type: "button", class: "btn btn-primary", onclick: handlers.onNew }, [icon("plus"), "Nuevo usuario"]),
      ],
    }),
    tableCard,
    modal.element
  );

  const columns = (currentUserId) => [
    {
      key: "name", label: "Usuario",
      render: (u) => el("div", { class: "user-cell" }, [
        el("span", { class: "avatar" }, [initials(u.name)]),
        el("div", {}, [
          el("div", { class: "user-cell-name" }, [u.name, u.id === currentUserId ? " (tú)" : ""]),
          el("div", { class: "user-cell-sub" }, [u.email]),
        ]),
      ]),
    },
    { key: "role", label: "Rol", render: (u) => badge(ROLE_LABEL[u.role] || u.role, u.role === "admin" ? "accent" : "neutral") },
    { key: "emailVerified", label: "Verificado", render: (u) => badge(u.emailVerified ? "Sí" : "No", u.emailVerified ? "success" : "warning") },
    { key: "createdDate", label: "Creado", render: (u) => formatDate(u.createdDate) },
    {
      key: "actions", label: "Acciones", align: "right",
      render: (u) => {
        const isSelf = u.id === currentUserId;
        return el("div", { class: "cell-actions" }, [
          el("button", { type: "button", class: "btn btn-ghost btn-icon", title: "Editar", "aria-label": `Editar a ${u.name}`, onclick: () => handlers.onEdit(u) }, [icon("edit")]),
          el("button", {
            type: "button", class: "btn btn-ghost btn-icon", disabled: isSelf,
            title: isSelf ? "No puedes eliminar tu propio usuario" : "Eliminar", "aria-label": `Eliminar a ${u.name}`,
            onclick: () => handlers.onDelete(u),
          }, [icon("trash")]),
        ]);
      },
    },
  ];

  return {
    showLoading() {
      tableCard.replaceChildren(skeleton(5));
    },

    showUsers(users, meta, currentUserId) {
      subtitle.textContent = `${formatNumber(meta.total)} ${meta.total === 1 ? "cuenta registrada" : "cuentas registradas"}`;
      if (!users.length) {
        tableCard.replaceChildren(emptyState({
          icon: "users", title: "Sin usuarios", text: "Crea el primer usuario.",
          action: { label: "Nuevo usuario", icon: "plus", onClick: handlers.onNew },
        }));
        return;
      }
      tableCard.replaceChildren(dataTable({ columns: columns(currentUserId), rows: users, onRowClick: handlers.onSelect }), pagination(meta, handlers.onPageChange));
    },

    showDetailLoading() {
      drawer.showLoading();
    },

    showUserDetail(user, { isSelf = false } = {}) {
      drawer.setTitle(user.name);
      const content = descriptionList([
        { label: "Nombre", value: el("span", {}, [user.name, isSelf ? " (tú)" : ""]) },
        { label: "Correo", value: user.email },
        { label: "Rol", value: badge(ROLE_LABEL[user.role] || user.role, user.role === "admin" ? "accent" : "neutral") },
        { label: "Verificado", value: badge(user.emailVerified ? "Sí" : "No", user.emailVerified ? "success" : "warning") },
        { label: "Creado", value: formatDate(user.createdDate) },
      ]);
      drawer.open(content, [
        el("button", { type: "button", class: "btn btn-secondary", onclick: () => handlers.onEdit(user) }, [icon("edit"), "Editar"]),
        el("button", {
          type: "button", class: "btn btn-danger", disabled: isSelf,
          title: isSelf ? "No puedes eliminar tu propio usuario" : "Eliminar",
          onclick: () => handlers.onDelete(user),
        }, [icon("trash"), "Eliminar"]),
      ]);
    },

    closeDetail() {
      drawer.close();
    },

    showError() {
      tableCard.replaceChildren(errorState({ text: "No se pudieron cargar los usuarios.", onRetry: handlers.onRetry }));
    },

    // isSelf: la contraseña propia se cambia en Mi perfil
    openForm(user = null, { isSelf = false } = {}) {
      modal.setTitle(user ? "Editar usuario" : "Nuevo usuario");
      form.reset();
      nameInput.value = user?.name || "";
      emailInput.value = user?.email || "";
      roleSelect.value = user?.role || "user";
      roleSelect.disabled = isSelf;
      roleHint.classList.toggle("hidden", !isSelf);
      passwordInput.required = !user;
      passwordLabel.textContent = user ? "Nueva contraseña (opcional)" : "Contraseña";
      passwordField.classList.toggle("hidden", isSelf);
      this.setSaving(false);
      modal.open();
    },

    setSaving(saving) {
      saveButton.classList.toggle("is-loading", saving);
      saveButton.disabled = saving;
    },

    closeForm() {
      modal.close();
    },
  };
}
