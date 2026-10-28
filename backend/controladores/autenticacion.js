// Controlador de /api/auth: recibe la petición ya validada (req.dto), llama al servicio y responde con la vista.
const { Router } = require("express");
const authService = require("../servicios/autenticacion");
const { asyncHandler, CODE_PURPOSE } = require("../configuracion");
const { authRateLimiter, loginEmailLimiter, resendIpLimiter, resendEmailLimiter } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");
// DTO de petición (req): lo que envía el cliente
const {
  RegisterRequestDto,
  CredentialsRequestDto,
  VerifyCodeRequestDto,
  ResendCodeRequestDto,
  RefreshTokenRequestDto,
} = require("../dto/autenticacion");
// Vistas (res): lo que responde el servidor
const { MessageResponseDto } = require("../vistas/comunes");
const { VerificationRequiredResponseDto, EmailVerifiedResponseDto, SessionResponseDto } = require("../vistas/autenticacion");

// ---------- Endpoints ----------
// /api/auth: todos públicos, con límite de intentos.

const router = Router();

// POST /api/auth/register (público)
router.post("/register", authRateLimiter, validateRequest(RegisterRequestDto), asyncHandler(register));
// POST /api/auth/register/verify (público)
router.post("/register/verify", authRateLimiter, validateRequest(VerifyCodeRequestDto), asyncHandler(verifyRegistration));
// POST /api/auth/register/resend-code (público)
router.post("/register/resend-code", resendIpLimiter, resendEmailLimiter, validateRequest(ResendCodeRequestDto), asyncHandler(resendRegistrationCode));
// POST /api/auth/login (público)
router.post("/login", authRateLimiter, loginEmailLimiter, validateRequest(CredentialsRequestDto), asyncHandler(login));
// POST /api/auth/login/verify (público)
router.post("/login/verify", authRateLimiter, validateRequest(VerifyCodeRequestDto), asyncHandler(verifyLogin));
// POST /api/auth/login/resend-code (público)
router.post("/login/resend-code", resendIpLimiter, resendEmailLimiter, validateRequest(ResendCodeRequestDto), asyncHandler(resendLoginCode));
// POST /api/auth/refresh-token (público: usa el refresh token del cuerpo)
router.post("/refresh-token", validateRequest(RefreshTokenRequestDto), asyncHandler(refreshToken));

// ---------- Funciones del controlador ----------

async function register(req, res) {
  const result = await authService.register(req.dto);
  res.status(201).json(new VerificationRequiredResponseDto(result));
}

async function verifyRegistration(req, res) {
  await authService.verifyRegistration(req.dto);
  res.json(new EmailVerifiedResponseDto());
}

// Secuencia del tablero: Vista → CredentialsRequestDto → login → validateCredentials → User (Modelo) → BD
async function login(req, res) {
  const user = await authService.validateCredentials(req.dto); // validarCredenciales(usu, contra)
  res.json(new VerificationRequiredResponseDto(await authService.startLoginVerification(user)));
}

async function verifyLogin(req, res) {
  res.json(new SessionResponseDto(await authService.verifyLogin(req.dto)));
}

async function resendLoginCode(req, res) {
  await authService.resendCode({ email: req.dto.email, purpose: CODE_PURPOSE.LOGIN });
  res.json(new MessageResponseDto("Código reenviado"));
}

async function resendRegistrationCode(req, res) {
  await authService.resendCode({ email: req.dto.email, purpose: CODE_PURPOSE.REGISTRATION });
  res.json(new MessageResponseDto("Código reenviado"));
}

async function refreshToken(req, res) {
  res.json(new SessionResponseDto(await authService.refreshSession(req.dto)));
}

module.exports = {
  router,
  register,
  verifyRegistration,
  login,
  verifyLogin,
  resendLoginCode,
  resendRegistrationCode,
  refreshToken,
};
