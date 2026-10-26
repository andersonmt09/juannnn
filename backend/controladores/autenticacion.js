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

// Secuencia del tablero: Vista → CredentialsRequestDto → login → validateCredentials → User (Modelo) → BD
const login = asyncHandler(async (req, res) => {
  const user = await authService.validateCredentials(req.dto); // validarCredenciales(usu, contra)
  res.json(new VerificationRequiredResponseDto(await authService.startLoginVerification(user)));
});

// Respuesta genérica: no revela si el correo existe.
const forgotPassword = asyncHandler(async (req, res) => {
  await authService.requestPasswordReset(req.dto);
  res.json(new MessageResponseDto("Si el correo está registrado, te enviamos un código para restablecer tu contraseña"));
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.dto);
  res.json(new MessageResponseDto("Contraseña actualizada. Ya puedes iniciar sesión."));
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
  forgotPassword,
  resetPassword,
  verifyLogin,
  resendLoginCode,
  resendRegistrationCode,
  refreshToken,
};
