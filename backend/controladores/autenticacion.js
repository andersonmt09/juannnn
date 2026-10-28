// Controlador de /api/auth: recibe la petición ya validada (req.dto), llama al servicio y responde con la vista.
const authService = require("../servicios/autenticacion");
const { asyncHandler, CODE_PURPOSE } = require("../configuracion");
const { MessageResponseDto } = require("../vistas/comunes");
const {
  VerificationRequiredResponseDto,
  EmailVerifiedResponseDto,
  SessionResponseDto,
} = require("../vistas/autenticacion");
const { Router } = require("express");
const views = require("../vistas/autenticacion");
const { authRateLimiter, loginEmailLimiter, passwordResetLimiter, resendIpLimiter, resendEmailLimiter } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");

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

// ---------- Endpoints de /api/auth (públicos, con límite de intentos) ----------

const router = Router();

// POST /api/auth/register (público)
router.post("/register", authRateLimiter, validateRequest(views.RegisterRequestDto), register);
// POST /api/auth/register/verify (público)
router.post("/register/verify", authRateLimiter, validateRequest(views.VerifyCodeRequestDto), verifyRegistration);
// POST /api/auth/register/resend-code (público)
router.post("/register/resend-code", resendIpLimiter, resendEmailLimiter, validateRequest(views.ResendCodeRequestDto), resendRegistrationCode);
// POST /api/auth/login (público)
router.post("/login", authRateLimiter, loginEmailLimiter, validateRequest(views.CredentialsRequestDto), login);
// POST /api/auth/login/verify (público)
router.post("/login/verify", authRateLimiter, validateRequest(views.VerifyCodeRequestDto), verifyLogin);
// POST /api/auth/login/resend-code (público)
router.post("/login/resend-code", resendIpLimiter, resendEmailLimiter, validateRequest(views.ResendCodeRequestDto), resendLoginCode);
// POST /api/auth/password/forgot (público)
router.post("/password/forgot", passwordResetLimiter, resendEmailLimiter, validateRequest(views.ForgotPasswordRequestDto), forgotPassword);
// POST /api/auth/password/reset (público)
router.post("/password/reset", authRateLimiter, validateRequest(views.ResetPasswordRequestDto), resetPassword);
// POST /api/auth/refresh-token (público: usa el refresh token del cuerpo)
router.post("/refresh-token", validateRequest(views.RefreshTokenRequestDto), refreshToken);

module.exports = {
  router,
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
