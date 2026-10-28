// Controlador de /api/users: recibe la petición ya validada (req.dto), llama al servicio y responde con la vista.
const userService = require("../servicios/usuarios");
const { asyncHandler } = require("../configuracion");
const { MessageResponseDto } = require("../vistas/comunes");
const { UserResponseDto, UserListResponseDto } = require("../vistas/usuarios");
const { SessionResponseDto } = require("../vistas/autenticacion");
const { Router } = require("express");
const views = require("../vistas/usuarios");
const { authenticate, authorize } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");
const { ROLES } = require("../configuracion");

const list = asyncHandler(async (req, res) => {
  res.json(new UserListResponseDto(await userService.list(req.dto)));
});

const getById = asyncHandler(async (req, res) => {
  res.json(new UserResponseDto(await userService.getById(req.dto.id, req.user)));
});

const create = asyncHandler(async (req, res) => {
  res.status(201).json(new UserResponseDto(await userService.create(req.dto, req.user)));
});

const update = asyncHandler(async (req, res) => {
  res.json(new UserResponseDto(await userService.update(req.dto.id, req.dto.changes(), req.user)));
});

const changePassword = asyncHandler(async (req, res) => {
  const session = await userService.changePassword(req.dto.id, req.dto, req.user);
  // Propia: sesión nueva (las demás quedan cerradas). De otro usuario: solo mensaje.
  res.json(session ? new SessionResponseDto(session) : new MessageResponseDto("Contraseña actualizada"));
});

const remove = asyncHandler(async (req, res) => {
  await userService.remove(req.dto.id, req.user);
  res.json(new MessageResponseDto("Usuario eliminado"));
});

// ---------- Endpoints de /api/users (administrador, salvo ver el propio perfil y cambiar la propia contraseña) ----------

const router = Router();
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

// GET /api/users (administrador)
router.get("/", adminOnly, validateRequest(views.ListUsersRequestDto), list);
// GET /api/users/:id (con sesión; el servicio limita a no administradores a su propio perfil)
router.get("/:id", authenticate, validateRequest(views.UserIdRequestDto), getById);
// POST /api/users (administrador)
router.post("/", adminOnly, validateRequest(views.CreateUserRequestDto), create);
// PUT /api/users/:id (administrador)
router.put("/:id", adminOnly, validateRequest(views.UpdateUserRequestDto), update);
// PATCH /api/users/:id/password (con sesión)
router.patch("/:id/password", authenticate, validateRequest(views.ChangePasswordRequestDto), changePassword);
// DELETE /api/users/:id (administrador)
router.delete("/:id", adminOnly, validateRequest(views.UserIdRequestDto), remove);

module.exports = { router, list, getById, create, update, changePassword, remove };
