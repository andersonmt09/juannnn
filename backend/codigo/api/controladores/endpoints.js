// Controlador de /api/endpoints.
const endpointService = require("../../casos-de-uso/endpoints");
const asyncHandler = require("../../utilidades/manejador-async");

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
