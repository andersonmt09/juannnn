// Controlador de #/profile: muestra los datos de la sesión y cambia la contraseña propia (pide la actual).
import { renderProfileView } from "../vistas/perfil.js";
import { userApi } from "../modelos/api.js";
import { session } from "../modelos/sesion.js";
import { toast } from "../utilidades.js";

export function showProfile(container) {
  const user = session.getUser();

  const view = renderProfileView(container, { user }, {
    async onChangePassword({ currentPassword, password, confirmPassword }) {
      if (password !== confirmPassword) {
        toast.error("Las contraseñas nuevas no coinciden");
        return;
      }
      try {
        await userApi.changePassword(user.id, password, currentPassword);
        toast.success("Contraseña actualizada");
        view.resetForm();
      } catch (error) {
        toast.error(error.message);
      }
    },
  });
}
