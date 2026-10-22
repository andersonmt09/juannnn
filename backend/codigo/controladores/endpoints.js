// Controlador de /api/endpoints: recibe el DTO de petición (req.dto), llama al servicio y responde con su DTO de respuesta.
const endpointService = require("../servicios/endpoints");
const asyncHandler = require("../utilidades/manejador-async");
const { MessageResponseDto } = require("../dtos/respuesta/comunes");
const { EndpointResponseDto, EndpointListResponseDto } = require("../dtos/respuesta/endpoints");

const list = asyncHandler(async (req, res) => {
  res.json(new EndpointListResponseDto(await endpointService.list()));
});

const create = asyncHandler(async (req, res) => {
  res.status(201).json(new EndpointResponseDto(await endpointService.create(req.dto)));
});

const remove = asyncHandler(async (req, res) => {
  await endpointService.remove(req.dto.id);
  res.json(new MessageResponseDto("Endpoint eliminado"));
});

module.exports = { list, create, remove };
