/**
 * VISTA: Mi perfil (RF-17) y cambio de contraseña (RF-09)   ruta: #/profile
 */
import { el } from "../../utils/dom.js";
import { toast } from "../../utils/toast.js";
import { userService } from "../../services/user.service.js";
import { session } from "../../services/session.service.js";
import { pageHeader } from "../../components/page-header.component.js";

export function renderProfileView(container) {
  const user = session.getUser();

  const form = el("form", {}, [
    el("label", { for: "profile-password" }, ["Nueva contraseña (mínimo 6 caracteres)"]),
    el("input", { id: "profile-password", name: "password", type: "password", required: true, minlength: "6", autocomplete: "new-password" }),
    el("button", { type: "submit", class: "btn btn-primary" }, ["Actualizar contraseña"]),
  ]);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await userService.changePassword(user.id, new FormData(form).get("password"));
      toast.success("Contraseña actualizada");
      form.reset();
    } catch (error) {
      toast.error(error.message);
    }
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
}
