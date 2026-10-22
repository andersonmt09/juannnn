// Vista de perfil (#/profile): datos del usuario y formulario de cambio de contraseña.
import { el } from "../utilidades/dom.js";
import { pageHeader } from "../componentes/encabezado.js";

/**
 * @param {HTMLElement} container
 * @param {{ user: { name: string, email: string, role: string } }} data
 * @param {{ onChangePassword: (password: string) => void }} handlers
 */
export function renderProfileView(container, { user }, { onChangePassword }) {
  const form = el("form", {}, [
    el("label", { for: "profile-password" }, ["Nueva contraseña (mínimo 6 caracteres)"]),
    el("input", { id: "profile-password", name: "password", type: "password", required: true, minlength: "6", autocomplete: "new-password" }),
    el("button", { type: "submit", class: "btn btn-primary" }, ["Actualizar contraseña"]),
  ]);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    onChangePassword(new FormData(form).get("password"));
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
