// Controlador de /api/users: recibe la petición ya validada (req.dto), llama al servicio y responde con la vista.
const { Router } = require("express");
const userService = require("../servicios/usuarios");
const { asyncHandler, ROLES } = require("../configuracion");
const { authenticate, authorize } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");
// DTO de petición (req): lo que envía el cliente
const { ListUsersRequestDto, CreateUserRequestDto, UpdateUserRequestDto, ChangePasswordRequestDto, UserIdRequestDto } = require("../dto/usuarios");
// Vistas (res): lo que responde el servidor
const { MessageResponseDto } = require("../vistas/comunes");
const { UserResponseDto, UserListResponseDto } = require("../vistas/usuarios");
const { SessionResponseDto } = require("../vistas/autenticacion");

// ---------- Endpoints ----------
// /api/users: administrador, salvo ver el propio perfil y cambiar la propia contraseña.

const router = Router();
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

// GET /api/users (administrador)
router.get("/", adminOnly, validateRequest(ListUsersRequestDto), asyncHandler(list));
// GET /api/users/:id (con sesión; el servicio limita a no administradores a su propio perfil)
router.get("/:id", authenticate, validateRequest(UserIdRequestDto), asyncHandler(getById));
// POST /api/users (administrador)
router.post("/", adminOnly, validateRequest(CreateUserRequestDto), asyncHandler(create));
// PUT /api/users/:id (administrador)
router.put("/:id", adminOnly, validateRequest(UpdateUserRequestDto), asyncHandler(update));
// PATCH /api/users/:id/password (con sesión)
router.patch("/:id/password", authenticate, validateRequest(ChangePasswordRequestDto), asyncHandler(changePassword));
// DELETE /api/users/:id (administrador)
router.delete("/:id", adminOnly, validateRequest(UserIdRequestDto), asyncHandler(remove));

// ---------- Funciones del controlador ----------

async function list(req, res) {
  res.json(new UserListResponseDto(await userService.list(req.dto)));
}

async function getById(req, res) {
  res.json(new UserResponseDto(await userService.getById(req.dto.id, req.user)));
}

async function create(req, res) {
  res.status(201).json(new UserResponseDto(await userService.create(req.dto, req.user)));
}

async function update(req, res) {
  res.json(new UserResponseDto(await userService.update(req.dto.id, req.dto.changes(), req.user)));
}

async function changePassword(req, res) {
  const session = await userService.changePassword(req.dto.id, req.dto, req.user);
  // Propia: sesión nueva (las demás quedan cerradas). De otro usuario: solo mensaje.
  res.json(session ? new SessionResponseDto(session) : new MessageResponseDto("Contraseña actualizada"));
}

async function remove(req, res) {
  await userService.remove(req.dto.id, req.user);
  res.json(new MessageResponseDto("Usuario eliminado"));
}

module.exports = { router, list, getById, create, update, changePassword, remove };
