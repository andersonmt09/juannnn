const axonService = require("../services/axonService");

class AxonController {
  async listEndpoints(req, res, next) {
    try { res.json({ ok: true, data: await axonService.listEndpoints() }); }
    catch (e) { next(e); }
  }
  async createEndpoint(req, res, next) {
    try {
      const data = await axonService.createEndpoint(req.body || {});
      res.status(201).json({ ok: true, data });
    } catch (e) { next(e); }
  }
  async deleteEndpoint(req, res, next) {
    try {
      const data = await axonService.deleteEndpoint(req.params.id);
      res.json({ ok: true, ...data });
    } catch (e) { next(e); }
  }
}

module.exports = new AxonController();
