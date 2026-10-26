// Rutas de usuarios: /api/users (requieren sesión de administrador, salvo el cambio de la propia contraseña)
const { Router } = require("express");
const userController = require("../controladores/usuarios");
const { authenticate } = require("../middlewares/autenticacion");
const { authorize } = require("../middlewares/roles");
const { validateRequest } = require("../middlewares/validacion");
const {
  ListUsersRequestDto,
  CreateUserRequestDto,
  UpdateUserRequestDto,
  ChangePasswordRequestDto,
  UserIdRequestDto,
} = require("../dtos/peticion/usuarios");
const { ROLES } = require("../constantes/roles");

const router = Router();
const adminOnly = authorize(ROLES.ADMIN);

router.use(authenticate);

router.get("/", adminOnly, validateRequest(ListUsersRequestDto), userController.list);
router.post("/", adminOnly, validateRequest(CreateUserRequestDto), userController.create);
router.put("/:id", adminOnly, validateRequest(UpdateUserRequestDto), userController.update);
router.patch("/:id/password", validateRequest(ChangePasswordRequestDto), userController.changePassword);
router.delete("/:id", adminOnly, validateRequest(UserIdRequestDto), userController.remove);

module.exports = router;
