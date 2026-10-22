// Rutas de usuarios: /api/users (requieren sesión)
const { Router } = require("express");
const userController = require("../controladores/usuarios");
const { authenticate } = require("../middlewares/autenticacion");
const { authorize } = require("../middlewares/roles");
const { validateRequest } = require("../middlewares/validacion");
const {
  ListUsersRequestDto,
  UserIdRequestDto,
  CreateUserRequestDto,
  UpdateUserRequestDto,
  ChangePasswordRequestDto,
} = require("../dtos/peticion/usuarios");
const { ROLES } = require("../constantes/roles");

const router = Router();
const adminOnly = authorize(ROLES.ADMIN);

router.use(authenticate);

router.get("/", validateRequest(ListUsersRequestDto), userController.list);
router.get("/:id", validateRequest(UserIdRequestDto), userController.getById);
router.post("/", adminOnly, validateRequest(CreateUserRequestDto), userController.create);
router.put("/:id", adminOnly, validateRequest(UpdateUserRequestDto), userController.update);
router.patch("/:id/password", validateRequest(ChangePasswordRequestDto), userController.changePassword);
router.delete("/:id", adminOnly, validateRequest(UserIdRequestDto), userController.remove);

module.exports = router;
