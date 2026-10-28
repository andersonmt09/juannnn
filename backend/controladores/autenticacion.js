const { Router } = require("express");
const { asyncHandler } = require("../configuracion");
const { authRateLimiter, loginEmailLimiter, resendIpLimiter, resendEmailLimiter } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");
const {
  RegisterRequestDto, CredentialsRequestDto, VerifyCodeRequestDto, ResendCodeRequestDto, RefreshTokenRequestDto,
  register, verifyRegistration, login, verifyLogin, resendLoginCode, resendRegistrationCode, refreshToken,
} = require("../dto/autenticacion");

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

module.exports = router;
