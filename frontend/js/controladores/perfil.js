// Controlador de #/profile: muestra los datos frescos del usuario (GET /users/:id) y cambia la contraseña propia.
import { renderProfileView } from "../vistas/perfil.js";
import { getUser, changePassword } from "./usuarios.js";
import { ChangePasswordRequestDto } from "../vistas/dto.js";
import { session } from "../modelos/sesion.js";
import { toast } from "../utilidades.js";

export function showProfile(container) {
  const user = session.getUser();
  let active = true;

  const view = renderProfileView(container, { user }, {
    async onChangePassword({ currentPassword, password, confirmPassword }) {
      if (password !== confirmPassword) {
        toast.error("Las contraseñas nuevas no coinciden");
        return;
      }
      view.setSaving(true);
      try {
        const result = await changePassword(user.id, new ChangePasswordRequestDto({ password, currentPassword }));
        // Las demás sesiones se cierran: se guarda la sesión nueva para seguir conectado aquí.
        if (result?.accessToken) session.save(result);
        toast.success("Contraseña actualizada");
        view.resetForm();
      } catch (error) {
        toast.error(error.message);
      } finally {
        view.setSaving(false);
      }
    },
  });

  // Trae los datos del servidor: pueden haber cambiado desde el inicio de sesión.
  getUser(user.id).then((fresh) => {
    if (!active || !fresh) return;
    session.updateUser(fresh);
    view.setUser(fresh);
  }).catch((error) => {
    if (active) toast.error(error.message);
  });

  return () => { active = false; };
}
