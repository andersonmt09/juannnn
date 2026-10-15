const endpointRepository = require("../repositories/endpointRepository");

class AxonService {
  async listEndpoints() { return endpointRepository.findAll(); }
  async createEndpoint(data) {
    if (!data || !data.name || !data.path || !data.method) {
      const err = new Error("name, path y method son obligatorios");
      err.statusCode = 400;
      throw err;
    }
    return endpointRepository.create(data);
  }
  async deleteEndpoint(id) {
    const ep = await endpointRepository.findById(id);
    if (!ep) {
      const err = new Error("Endpoint no encontrado"); err.statusCode = 404; throw err;
    }
    await endpointRepository.delete(id);
    return { message: "Endpoint eliminado" };
  }
}

module.exports = new AxonService();
