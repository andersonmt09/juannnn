// Rutas de /api/users (administrador, salvo cambiar la propia contraseña).
const { Router } = require("express");
const users = require("../controladores/usuarios");
const views = require("../vistas/usuarios");
const { authenticate, authorize } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");
const { ROLES } = require("../configuracion");

const router = Router();
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

router.get("/", adminOnly, validateRequest(views.ListUsersRequestDto), users.list);
router.post("/", adminOnly, validateRequest(views.CreateUserRequestDto), users.create);
router.put("/:id", adminOnly, validateRequest(views.UpdateUserRequestDto), users.update);
router.patch("/:id/password", authenticate, validateRequest(views.ChangePasswordRequestDto), users.changePassword);
router.delete("/:id", adminOnly, validateRequest(views.UserIdRequestDto), users.remove);

module.exports = router;
