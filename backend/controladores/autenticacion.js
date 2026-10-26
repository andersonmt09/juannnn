// Controlador de /api/auth: recibe la petición ya validada (req.dto), llama al servicio y responde con la vista.
const authService = require("../servicios/autenticacion");
const { asyncHandler, CODE_PURPOSE } = require("../configuracion");
const { MessageResponseDto } = require("../vistas/comunes");
const {
  VerificationRequiredResponseDto,
  EmailVerifiedResponseDto,
  SessionResponseDto,
} = require("../vistas/autenticacion");

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.dto);
  res.status(201).json(new VerificationRequiredResponseDto(result));
});

const verifyRegistration = asyncHandler(async (req, res) => {
  await authService.verifyRegistration(req.dto);
  res.json(new EmailVerifiedResponseDto());
});

const login = asyncHandler(async (req, res) => {
  res.json(new VerificationRequiredResponseDto(await authService.login(req.dto)));
});

const verifyLogin = asyncHandler(async (req, res) => {
  res.json(new SessionResponseDto(await authService.verifyLogin(req.dto)));
});

const resendLoginCode = asyncHandler(async (req, res) => {
  await authService.resendCode({ email: req.dto.email, purpose: CODE_PURPOSE.LOGIN });
  res.json(new MessageResponseDto("Código reenviado"));
});

const resendRegistrationCode = asyncHandler(async (req, res) => {
  await authService.resendCode({ email: req.dto.email, purpose: CODE_PURPOSE.REGISTRATION });
  res.json(new MessageResponseDto("Código reenviado"));
});

const refreshToken = asyncHandler(async (req, res) => {
  res.json(new SessionResponseDto(await authService.refreshSession(req.dto)));
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
