// endpoints /api/users: solo la lista (método, ruta, filtros y DTO de petición)
const { Router } = require("express");
const { asyncHandler, ROLES } = require("../config/configuracion");
const { authenticate, authorize } = require("../config/autenticacion");
const { validateRequest } = require("../config/validacion");
const { ListUsersRequestDto, CreateUserRequestDto, UpdateUserRequestDto, ChangePasswordRequestDto, UserIdRequestDto } = require("../esquemas/DTOs_Usuarios_Autenticacion");

// las funciones de cada endpoint están en esquemas/DTOs_Usuarios_Autenticacion.js
const { list, getById, create, update, changePassword, remove } = require("../esquemas/DTOs_Usuarios_Autenticacion");

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

module.exports = { prefijo: "/users", router };
