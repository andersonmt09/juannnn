// Controlador de #/profile: muestra los datos de la sesión y cambia la contraseña propia.
import { renderProfileView } from "../vistas/perfil.js";
import { userService } from "../servicios/usuarios.js";
import { session } from "../modelos/sesion.js";
import { toast } from "../utilidades/notificaciones.js";

export function showProfile(container) {
  const user = session.getUser();

  const view = renderProfileView(container, { user }, {
    async onChangePassword(password) {
      try {
        await userService.changePassword(user.id, password);
        toast.success("Contraseña actualizada");
        view.resetForm();
      } catch (error) {
        toast.error(error.message);
      }
    },
  });
}
