// Controlador de /api/users.
const userService = require("../services/user.service");
const asyncHandler = require("../utils/async-handler");
const { ROLES } = require("../constants/roles");

const list = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  const includeInactive = req.query.all === "true" && req.user.role === ROLES.ADMIN;

  const { users, meta } = await userService.list({ includeInactive, page, limit });
  res.json({ ok: true, data: users, meta });
});

const getById = asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await userService.getById(req.params.id) });
});

const create = asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, data: await userService.create(req.dto, req.user.id) });
});

const update = asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await userService.update(req.params.id, req.dto) });
});

const changePassword = asyncHandler(async (req, res) => {
  res.json({ ok: true, ...(await userService.changePassword(req.params.id, req.dto, req.user)) });
});

const remove = asyncHandler(async (req, res) => {
  res.json({ ok: true, ...(await userService.remove(req.params.id, req.user)) });
});

module.exports = { list, getById, create, update, changePassword, remove };
