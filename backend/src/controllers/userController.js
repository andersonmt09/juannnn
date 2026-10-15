const userService = require("../services/userService");

class UserController {
  async list(req, res, next) {
    try {
      const includeInactive = req.query.all === "true" && req.user && req.user.role === "admin";
      const result = await userService.list({ includeInactive, page: req.query.page, limit: req.query.limit });
      res.json({ ok: true, data: result.data, meta: { total: result.total, page: result.page, limit: result.limit } });
    } catch (e) { next(e); }
  }
  async get(req, res, next) {
    try {
      const data = await userService.get(req.params.id);
      res.json({ ok: true, data });
    } catch (e) { next(e); }
  }
  async create(req, res, next) {
    try {
      const data = await userService.create(req.body || {}, req.user ? req.user.id : null);
      res.status(201).json({ ok: true, data });
    } catch (e) { next(e); }
  }
  async update(req, res, next) {
    try {
      const data = await userService.update(req.params.id, req.body || {});
      res.json({ ok: true, data });
    } catch (e) { next(e); }
  }
  async changePassword(req, res, next) {
    try {
      const { password } = req.body || {};
      const data = await userService.changePassword(req.params.id, password, req.user);
      res.json({ ok: true, data });
    } catch (e) { next(e); }
  }
  async remove(req, res, next) {
    try {
      const data = await userService.remove(req.params.id, req.user ? req.user.id : null);
      res.json({ ok: true, ...data });
    } catch (e) { next(e); }
  }
}

module.exports = new UserController();
