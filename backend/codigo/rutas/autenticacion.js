// Rutas públicas de autenticación: /api/auth
// Cada endpoint indica su DTO de petición; el DTO de respuesta lo arma el controlador.
const { Router } = require("express");
const authController = require("../controladores/autenticacion");
const { validateRequest } = require("../middlewares/validacion");
const { authRateLimiter } = require("../middlewares/limite-intentos");
const {
  RegisterRequestDto,
  LoginRequestDto,
  VerifyCodeRequestDto,
  ResendCodeRequestDto,
  RefreshTokenRequestDto,
} = require("../dtos/peticion/autenticacion");

const router = Router();

// Registro
router.post("/register", authRateLimiter, validateRequest(RegisterRequestDto), authController.register);
router.post("/register/verify", authRateLimiter, validateRequest(VerifyCodeRequestDto), authController.verifyRegistration);
router.post("/register/resend-code", authRateLimiter, validateRequest(ResendCodeRequestDto), authController.resendRegistrationCode);

// Inicio de sesión en dos pasos
router.post("/login", authRateLimiter, validateRequest(LoginRequestDto), authController.login);
router.post("/login/verify", authRateLimiter, validateRequest(VerifyCodeRequestDto), authController.verifyLogin);
router.post("/login/resend-code", authRateLimiter, validateRequest(ResendCodeRequestDto), authController.resendLoginCode);

// Renovación del token de acceso
router.post("/refresh-token", validateRequest(RefreshTokenRequestDto), authController.refreshToken);

module.exports = router;
