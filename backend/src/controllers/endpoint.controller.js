/**
 * CONTROLADOR: Endpoints monitoreados  →  /api/endpoints
 */
const endpointService = require("../services/endpoint.service");
const asyncHandler = require("../utils/async-handler");

const list = asyncHandler(async (req, res) => {
  res.json({ ok: true, data: await endpointService.list() });
});

const create = asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, data: await endpointService.create(req.dto) });
});

const remove = asyncHandler(async (req, res) => {
  res.json({ ok: true, ...(await endpointService.remove(req.params.id)) });
});

module.exports = { list, create, remove };
