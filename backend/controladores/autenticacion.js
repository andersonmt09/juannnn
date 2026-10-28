// Endpoints de /api/auth: todos públicos, con límite de intentos.
const { Router } = require("express");
const { asyncHandler } = require("../configuracion");
const { authRateLimiter, loginEmailLimiter, resendIpLimiter, resendEmailLimiter } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");
const {
  RegisterRequestDto, CredentialsRequestDto, VerifyCodeRequestDto, ResendCodeRequestDto, RefreshTokenRequestDto,
  register, verifyRegistration, login, verifyLogin, resendLoginCode, resendRegistrationCode, refreshToken,
} = require("../dto/autenticacion");

const router = Router();

// POST /api/auth/register — público — inicia el registro y envía el código
router.post("/register", authRateLimiter, validateRequest(RegisterRequestDto), asyncHandler(register));
// POST /api/auth/register/verify — público — confirma el correo con el código
router.post("/register/verify", authRateLimiter, validateRequest(VerifyCodeRequestDto), asyncHandler(verifyRegistration));
// POST /api/auth/register/resend-code — público — reenvía el código de registro
router.post("/register/resend-code", resendIpLimiter, resendEmailLimiter, validateRequest(ResendCodeRequestDto), asyncHandler(resendRegistrationCode));
// POST /api/auth/login — público — valida credenciales y envía el código (paso 1)
router.post("/login", authRateLimiter, loginEmailLimiter, validateRequest(CredentialsRequestDto), asyncHandler(login));
// POST /api/auth/login/verify — público — valida el código y abre la sesión (paso 2)
router.post("/login/verify", authRateLimiter, validateRequest(VerifyCodeRequestDto), asyncHandler(verifyLogin));
// POST /api/auth/login/resend-code — público — reenvía el código de acceso
router.post("/login/resend-code", resendIpLimiter, resendEmailLimiter, validateRequest(ResendCodeRequestDto), asyncHandler(resendLoginCode));
// POST /api/auth/refresh-token — público — renueva la sesión con el refresh token del cuerpo
router.post("/refresh-token", validateRequest(RefreshTokenRequestDto), asyncHandler(refreshToken));

module.exports = router;
