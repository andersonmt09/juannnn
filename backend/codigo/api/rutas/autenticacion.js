// Rutas públicas de autenticación: /api/auth
const { Router } = require("express");
const authController = require("../controladores/autenticacion");
const { validateBody } = require("../../seguridad/intermediarios/validacion");
const { authRateLimiter } = require("../../seguridad/intermediarios/limite-intentos");
const { LoginDto, RegisterDto, VerifyCodeDto, EmailDto, RefreshTokenDto } = require("../validadores/autenticacion");

const router = Router();

// Registro
router.post("/register", authRateLimiter, validateBody(RegisterDto), authController.register);
router.post("/register/verify", authRateLimiter, validateBody(VerifyCodeDto), authController.verifyRegistration);
router.post("/register/resend-code", authRateLimiter, validateBody(EmailDto), authController.resendRegistrationCode);

// Inicio de sesión en dos pasos
router.post("/login", authRateLimiter, validateBody(LoginDto), authController.login);
router.post("/login/verify", authRateLimiter, validateBody(VerifyCodeDto), authController.verifyLogin);
router.post("/login/resend-code", authRateLimiter, validateBody(EmailDto), authController.resendLoginCode);

// Renovación del token de acceso
router.post("/refresh-token", validateBody(RefreshTokenDto), authController.refreshToken);

module.exports = router;
