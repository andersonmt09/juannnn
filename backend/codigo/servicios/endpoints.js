// Lógica de los endpoints monitoreados.
const Endpoint = require("../modelos/endpoint");
const HttpError = require("../utilidades/error-http");
const { EndpointResponseDto } = require("../dtos/salida/endpoint");

async function list() {
  const endpoints = await Endpoint.findAll();
  return endpoints.map((e) => new EndpointResponseDto(e));
}

async function create(data) {
  return new EndpointResponseDto(await Endpoint.create(data));
}

async function remove(id) {
  const endpoint = await Endpoint.findById(id);
  if (!endpoint) throw HttpError.notFound("Endpoint no encontrado");
  await Endpoint.delete(id);
  return { message: "Endpoint eliminado" };
}

module.exports = { list, create, remove };
