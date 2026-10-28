// Endpoints de /api/users: administrador, salvo ver el propio perfil y cambiar la propia contraseña.
const { Router } = require("express");
const { asyncHandler, ROLES } = require("../configuracion");
const { authenticate, authorize } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");
const {
  ListUsersRequestDto, CreateUserRequestDto, UpdateUserRequestDto, ChangePasswordRequestDto, UserIdRequestDto,
  list, getById, create, update, changePassword, remove,
} = require("../dto/usuarios");

const router = Router();
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

// GET /api/users — administrador — lista usuarios con paginación
router.get("/", adminOnly, validateRequest(ListUsersRequestDto), asyncHandler(list));
// GET /api/users/:id — con sesión — ver un usuario (el servicio limita a no administradores a su propio perfil)
router.get("/:id", authenticate, validateRequest(UserIdRequestDto), asyncHandler(getById));
// POST /api/users — administrador — crea un usuario
router.post("/", adminOnly, validateRequest(CreateUserRequestDto), asyncHandler(create));
// PUT /api/users/:id — administrador — actualiza nombre, correo o rol
router.put("/:id", adminOnly, validateRequest(UpdateUserRequestDto), asyncHandler(update));
// PATCH /api/users/:id/password — con sesión — cambia la contraseña
router.patch("/:id/password", authenticate, validateRequest(ChangePasswordRequestDto), asyncHandler(changePassword));
// DELETE /api/users/:id — administrador — elimina (desactiva) un usuario
router.delete("/:id", adminOnly, validateRequest(UserIdRequestDto), asyncHandler(remove));

module.exports = router;
