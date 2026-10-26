// Controlador de /api/users: recibe el DTO de petición (req.dto), llama al servicio y responde con su DTO de respuesta.
const userService = require("../servicios/usuarios");
const asyncHandler = require("../utilidades/manejador-async");
const { MessageResponseDto } = require("../dtos/respuesta/comunes");
const { UserResponseDto, UserListResponseDto } = require("../dtos/respuesta/usuarios");

const list = asyncHandler(async (req, res) => {
  res.json(new UserListResponseDto(await userService.list(req.dto)));
});

const create = asyncHandler(async (req, res) => {
  res.status(201).json(new UserResponseDto(await userService.create(req.dto, req.user)));
});

const update = asyncHandler(async (req, res) => {
  res.json(new UserResponseDto(await userService.update(req.dto.id, req.dto.changes())));
});

const changePassword = asyncHandler(async (req, res) => {
  await userService.changePassword(req.dto.id, req.dto, req.user);
  res.json(new MessageResponseDto("Contraseña actualizada"));
});

const remove = asyncHandler(async (req, res) => {
  await userService.remove(req.dto.id, req.user);
  res.json(new MessageResponseDto("Usuario eliminado"));
});

module.exports = { list, create, update, changePassword, remove };
