// Lógica de los endpoints monitoreados.
const Endpoint = require("../modelos/endpoint");
const HttpError = require("../utilidades/error-http");

async function list() {
  return Endpoint.findAll();
}

async function create(data) {
  return Endpoint.create(data);
}

async function remove(id) {
  const endpoint = await Endpoint.findById(id);
  if (!endpoint) throw HttpError.notFound("Endpoint no encontrado");
  await Endpoint.delete(id);
  return { message: "Endpoint eliminado" };
}

module.exports = { list, create, remove };
