// endpoints /api/auth: cada uno valida con su DTO, llama a rutas/autenticacion.js y responde
const { Router } = require("express");
const { asyncHandler, clientInfo, CODE_PURPOSE } = require("../config/configuracion");
const { authRateLimiter, loginEmailLimiter, resendIpLimiter, resendEmailLimiter } = require("../config/autenticacion");
const { validateRequest } = require("../config/validacion");
const { RegisterRequestDto, CredentialsRequestDto, VerifyCodeRequestDto, ResendCodeRequestDto, RefreshTokenRequestDto, VerificationRequiredResponseDto, EmailVerifiedResponseDto, SessionResponseDto } = require("../esquemas/DTOs_Usuarios_Autenticacion");
const authService = require("../rutas/autenticacion");
const { MessageResponseDto } = require("../esquemas/DTOs_Comunes");

const router = Router();

// POST /api/auth/register - público
router.post("/register", authRateLimiter, validateRequest(RegisterRequestDto), asyncHandler(register));
// POST /api/auth/register/verify - público
router.post("/register/verify", authRateLimiter, validateRequest(VerifyCodeRequestDto), asyncHandler(verifyRegistration));
// POST /api/auth/register/resend-code - público
router.post("/register/resend-code", resendIpLimiter, resendEmailLimiter, validateRequest(ResendCodeRequestDto), asyncHandler(resendRegistrationCode));
// POST /api/auth/login - público
router.post("/login", authRateLimiter, loginEmailLimiter, validateRequest(CredentialsRequestDto), asyncHandler(login));
// POST /api/auth/login/verify - público
router.post("/login/verify", authRateLimiter, validateRequest(VerifyCodeRequestDto), asyncHandler(verifyLogin));
// POST /api/auth/login/resend-code - público
router.post("/login/resend-code", resendIpLimiter, resendEmailLimiter, validateRequest(ResendCodeRequestDto), asyncHandler(resendLoginCode));
// POST /api/auth/refresh-token - público
router.post("/refresh-token", validateRequest(RefreshTokenRequestDto), asyncHandler(refreshToken));

async function register(req, res) {
  const result = await authService.register(req.dto);
  res.status(201).json(new VerificationRequiredResponseDto(result));
}

async function verifyRegistration(req, res) {
  await authService.verifyRegistration(req.dto);
  res.json(new EmailVerifiedResponseDto());
}

async function login(req, res) {
  const user = await authService.validateCredentials(req.dto, clientInfo(req));
  res.json(new VerificationRequiredResponseDto(await authService.startLoginVerification(user)));
}

async function verifyLogin(req, res) {
  res.json(new SessionResponseDto(await authService.verifyLogin(req.dto, clientInfo(req))));
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
  res.json(new SessionResponseDto(await authService.refreshSession(req.dto, clientInfo(req))));
}

module.exports = { prefijo: "/auth", router };
