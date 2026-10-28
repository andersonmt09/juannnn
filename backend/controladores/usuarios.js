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

module.exports = router;
