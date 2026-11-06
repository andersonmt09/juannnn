// endpoints /api/users: cada uno valida con su DTO, llama a rutas/usuarios.js y responde
const { Router } = require("express");
const { asyncHandler, clientInfo, ROLES } = require("../config/configuracion");
const { authenticate, authorize } = require("../config/autenticacion");
const { validateRequest } = require("../config/validacion");
const { ListUsersRequestDto, CreateUserRequestDto, UpdateUserRequestDto, ChangePasswordRequestDto, UserIdRequestDto, UserResponseDto, UserListResponseDto, SessionResponseDto } = require("../esquemas/DTOs_Usuarios_Autenticacion");
const userService = require("../rutas/usuarios");
const { MessageResponseDto } = require("../esquemas/DTOs_Comunes");

const router = Router();
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

// GET /api/users - admin
router.get("/", adminOnly, validateRequest(ListUsersRequestDto), asyncHandler(list));
// GET /api/users/:id - con sesión
router.get("/:id", authenticate, validateRequest(UserIdRequestDto), asyncHandler(getById));
// POST /api/users - admin
router.post("/", adminOnly, validateRequest(CreateUserRequestDto), asyncHandler(create));
// PUT /api/users/:id - admin
router.put("/:id", adminOnly, validateRequest(UpdateUserRequestDto), asyncHandler(update));
// PATCH /api/users/:id/password - con sesión
router.patch("/:id/password", authenticate, validateRequest(ChangePasswordRequestDto), asyncHandler(changePassword));
// DELETE /api/users/:id - admin
router.delete("/:id", adminOnly, validateRequest(UserIdRequestDto), asyncHandler(remove));

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
  const session = await userService.changePassword(req.dto.id, req.dto, req.user, clientInfo(req));
  // propia: sesión nueva, las demás se cierran
  res.json(session ? new SessionResponseDto(session) : new MessageResponseDto("Contraseña actualizada"));
}

async function remove(req, res) {
  await userService.remove(req.dto.id, req.user);
  res.json(new MessageResponseDto("Usuario eliminado"));
}

module.exports = { prefijo: "/users", router };
