import { renderProfileView } from "../vistas/perfil.js";
import { getUser, changePassword } from "./usuarios.js";
import { ChangePasswordRequestDto, UserIdRequestDto } from "../dto/usuarios.js";
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
        const result = await changePassword(new UserIdRequestDto({ id: user.id }), new ChangePasswordRequestDto({ password, currentPassword }));
        // se cierran las demás sesiones: se guarda la nueva
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

  getUser(new UserIdRequestDto({ id: user.id })).then((fresh) => {
    if (!active || !fresh) return;
    session.updateUser(fresh);
    view.setUser(fresh);
  }).catch((error) => {
    if (active) toast.error(error.message);
  });

  return () => { active = false; };
}
