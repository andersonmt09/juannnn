// Vista de perfil (#/profile): datos del usuario y formulario de cambio de contraseña.
import { pageHeader } from "./componentes.js";
import { el } from "../utilidades.js";

/**
 * @param {HTMLElement} container
 * @param {{ user: { name: string, email: string, role: string } }} data
 * @param {{ onChangePassword: (data: { currentPassword: string, password: string, confirmPassword: string }) => void }} handlers
 */
export function renderProfileView(container, { user }, { onChangePassword }) {
  const form = el("form", {}, [
    el("label", { for: "profile-current-password" }, ["Contraseña actual"]),
    el("input", { id: "profile-current-password", name: "currentPassword", type: "password", required: true, autocomplete: "current-password" }),
    el("label", { for: "profile-password" }, ["Nueva contraseña (mínimo 6 caracteres)"]),
    el("input", { id: "profile-password", name: "password", type: "password", required: true, minlength: "6", autocomplete: "new-password" }),
    el("label", { for: "profile-confirm-password" }, ["Confirmar nueva contraseña"]),
    el("input", { id: "profile-confirm-password", name: "confirmPassword", type: "password", required: true, minlength: "6", autocomplete: "new-password" }),
    el("button", { type: "submit", class: "btn btn-primary" }, ["Actualizar contraseña"]),
  ]);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    onChangePassword(Object.fromEntries(new FormData(form)));
  });

  container.replaceChildren(
    pageHeader("Mi perfil"),
    el("div", { class: "panel" }, [
      el("p", {}, [el("strong", {}, ["Nombre: "]), user.name]),
      el("p", {}, [el("strong", {}, ["Correo: "]), user.email]),
      el("p", {}, [el("strong", {}, ["Rol: "]), user.role]),
    ]),
    el("div", { class: "panel" }, [el("h3", {}, ["Cambiar contraseña"]), form])
  );

  return {
    resetForm() {
      form.reset();
    },
  };
}
