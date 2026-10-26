// Controlador de /api/users: recibe la petición ya validada (req.dto), llama al servicio y responde con la vista.
const userService = require("../servicios/usuarios");
const { asyncHandler } = require("../configuracion");
const { MessageResponseDto } = require("../vistas/comunes");
const { UserResponseDto, UserListResponseDto } = require("../vistas/usuarios");
const { SessionResponseDto } = require("../vistas/autenticacion");

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

module.exports = { list, getById, create, update, changePassword, remove };
