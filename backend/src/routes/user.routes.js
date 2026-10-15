/**
 * RUTAS: Usuarios  →  /api/users   (requieren sesión)
 */
const { Router } = require("express");
const userController = require("../controllers/user.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const { validateBody, validateIdParam } = require("../middlewares/validate.middleware");
const { CreateUserDto, UpdateUserDto, ChangePasswordDto } = require("../dtos/user.dto");
const { ROLES } = require("../constants/roles");

const router = Router();
const adminOnly = authorize(ROLES.ADMIN);

router.use(authenticate);

router.get("/",                                                          userController.list);           // RF-06
router.get("/:id",            validateIdParam,                           userController.getById);        // RF-06
router.post("/",              adminOnly, validateBody(CreateUserDto),    userController.create);         // RF-07
router.put("/:id",            adminOnly, validateIdParam, validateBody(UpdateUserDto), userController.update); // RF-08
router.patch("/:id/password", validateIdParam, validateBody(ChangePasswordDto), userController.changePassword); // RF-09
router.delete("/:id",         adminOnly, validateIdParam,                userController.remove);         // RF-10

module.exports = router;
