// Rutas de usuarios: /api/users (requieren sesión)
const { Router } = require("express");
const userController = require("../controladores/usuarios");
const { authenticate, authorize } = require("../../seguridad/intermediarios/autenticacion");
const { validateBody, validateIdParam } = require("../../seguridad/intermediarios/validacion");
const { CreateUserDto, UpdateUserDto, ChangePasswordDto } = require("../validadores/usuarios");
const { ROLES } = require("../../seguridad/constantes/roles");

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
