// Rutas de /api/auth (públicas, con límite de intentos).
const { Router } = require("express");
const auth = require("../controladores/autenticacion");
const views = require("../vistas/autenticacion");
const { authRateLimiter, passwordResetLimiter } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");

const router = Router();

router.post("/register", authRateLimiter, validateRequest(views.RegisterRequestDto), auth.register);
router.post("/register/verify", authRateLimiter, validateRequest(views.VerifyCodeRequestDto), auth.verifyRegistration);
router.post("/register/resend-code", authRateLimiter, validateRequest(views.ResendCodeRequestDto), auth.resendRegistrationCode);
router.post("/login", authRateLimiter, validateRequest(views.CredentialsRequestDto), auth.login);
router.post("/login/verify", authRateLimiter, validateRequest(views.VerifyCodeRequestDto), auth.verifyLogin);
router.post("/login/resend-code", authRateLimiter, validateRequest(views.ResendCodeRequestDto), auth.resendLoginCode);
router.post("/password/forgot", passwordResetLimiter, validateRequest(views.ForgotPasswordRequestDto), auth.forgotPassword);
router.post("/password/reset", authRateLimiter, validateRequest(views.ResetPasswordRequestDto), auth.resetPassword);
router.post("/refresh-token", validateRequest(views.RefreshTokenRequestDto), auth.refreshToken);

module.exports = router;
