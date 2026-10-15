/**
 * SERVICIO: Endpoints monitoreados.
 * RF-12, RF-13
 */
const Endpoint = require("../models/endpoint.model");
const HttpError = require("../utils/http-error");

/** RF-12: lista los endpoints registrados. */
async function list() {
  return Endpoint.findAll();
}

/** RF-13: registra un endpoint. */
async function create(data) {
  return Endpoint.create(data);
}

/** RF-13: elimina un endpoint. */
async function remove(id) {
  const endpoint = await Endpoint.findById(id);
  if (!endpoint) throw HttpError.notFound("Endpoint no encontrado");
  await Endpoint.delete(id);
  return { message: "Endpoint eliminado" };
}

module.exports = { list, create, remove };
