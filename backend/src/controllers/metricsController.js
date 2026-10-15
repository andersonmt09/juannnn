const metricsService = require("../services/metricsService");

class MetricsController {
  async dashboard(req, res, next) {
    try {
      const data = await metricsService.dashboard();
      res.json({ ok: true, data });
    } catch (e) { next(e); }
  }
}

module.exports = new MetricsController();
