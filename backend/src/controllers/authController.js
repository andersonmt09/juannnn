const authService = require("../services/authService");

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ ok: false, message: "Email y contraseña son obligatorios" });
      }
      const result = await authService.login(email, password, req.ip || req.socket.remoteAddress);
      res.json(result);
    } catch (e) { next(e); }
  }
  async verifyCode(req, res, next) {
    try {
      const { email, code } = req.body || {};
      if (!email || !code) {
        return res.status(400).json({ ok: false, message: "Email y código son obligatorios" });
      }
      const result = await authService.verifyCode(email, code);
      res.json(result);
    } catch (e) { next(e); }
  }
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body || {};
      const result = await authService.register(name, email, password);
      res.status(201).json(result);
    } catch (e) { next(e); }
  }
  async verifyRegistration(req, res, next) {
    try {
      const { email, code } = req.body || {};
      if (!email || !code) {
        return res.status(400).json({ ok: false, message: "Email y código son obligatorios" });
      }
      const result = await authService.verifyRegistration(email, code);
      res.json(result);
    } catch (e) { next(e); }
  }
  async resendCode(req, res, next) {
    try {
      const { email } = req.body || {};
      if (!email) return res.status(400).json({ ok: false, message: "Email es obligatorio" });
      const result = await authService.resendCode(email);
      res.json(result);
    } catch (e) { next(e); }
  }
  async resendRegistration(req, res, next) {
    try {
      const { email } = req.body || {};
      if (!email) return res.status(400).json({ ok: false, message: "Email es obligatorio" });
      const result = await authService.resendRegistration(email);
      res.json(result);
    } catch (e) { next(e); }
  }
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body || {};
      const result = await authService.refreshToken(refreshToken);
      res.json(result);
    } catch (e) { next(e); }
  }
}

module.exports = new AuthController();
