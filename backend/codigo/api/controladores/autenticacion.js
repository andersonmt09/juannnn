// Controlador de /api/auth.
const authService = require("../../casos-de-uso/autenticacion");
const asyncHandler = require("../../utilidades/manejador-async");
const { CODE_PURPOSE } = require("../../seguridad/constantes/seguridad");

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
