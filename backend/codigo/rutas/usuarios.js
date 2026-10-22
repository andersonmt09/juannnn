// Rutas de usuarios: /api/users (requieren sesión)
const { Router } = require("express");
const userController = require("../controladores/usuarios");
const { authenticate } = require("../middlewares/autenticacion");
const { authorize } = require("../middlewares/roles");
const { validateBody, validateIdParam } = require("../middlewares/validacion");
const { CreateUserDto, UpdateUserDto, ChangePasswordDto } = require("../dtos/entrada/usuarios");
const { ROLES } = require("../constantes/roles");

const router = Router();
const adminOnly = authorize(ROLES.ADMIN);

router.use(authenticate);

router.get("/", userController.list);
router.get("/:id", validateIdParam, userController.getById);
router.post("/", adminOnly, validateBody(CreateUserDto), userController.create);
router.put("/:id", adminOnly, validateIdParam, validateBody(UpdateUserDto), userController.update);
router.patch("/:id/password", validateIdParam, validateBody(ChangePasswordDto), userController.changePassword);
router.delete("/:id", adminOnly, validateIdParam, userController.remove);

module.exports = router;
