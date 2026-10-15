/**
 * CONTROLADOR: Autenticación  →  /api/auth
 * Recibe la petición ya validada (req.dto), llama al servicio y responde.
 */
const authService = require("../services/auth.service");
const asyncHandler = require("../utils/async-handler");
const { CODE_PURPOSE } = require("../constants/security");

const register = asyncHandler(async (req, res) => {
  res.status(201).json({ ok: true, ...(await authService.register(req.dto)) });
});

const verifyRegistration = asyncHandler(async (req, res) => {
  res.json({ ok: true, ...(await authService.verifyRegistration(req.dto)) });
});

const login = asyncHandler(async (req, res) => {
  res.json({ ok: true, ...(await authService.login(req.dto)) });
});

const verifyLogin = asyncHandler(async (req, res) => {
  res.json({ ok: true, ...(await authService.verifyLogin(req.dto)) });
});

const resendLoginCode = asyncHandler(async (req, res) => {
  const result = await authService.resendCode({ email: req.dto.email, purpose: CODE_PURPOSE.LOGIN });
  res.json({ ok: true, ...result });
});

const resendRegistrationCode = asyncHandler(async (req, res) => {
  const result = await authService.resendCode({ email: req.dto.email, purpose: CODE_PURPOSE.REGISTRATION });
  res.json({ ok: true, ...result });
});

const refreshToken = asyncHandler(async (req, res) => {
  res.json({ ok: true, ...(await authService.refreshSession(req.dto)) });
});

module.exports = {
  register,
  verifyRegistration,
  login,
  verifyLogin,
  resendLoginCode,
  resendRegistrationCode,
  refreshToken,
};
