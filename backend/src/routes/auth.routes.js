/**
 * RUTAS: Autenticación  →  /api/auth   (públicas)
 */
const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const { validateBody } = require("../middlewares/validate.middleware");
const { authRateLimiter } = require("../middlewares/rate-limit.middleware");
const { LoginDto, RegisterDto, VerifyCodeDto, EmailDto, RefreshTokenDto } = require("../dtos/auth.dto");

const router = Router();

router.post("/register",                  authRateLimiter, validateBody(RegisterDto),     authController.register);               // RF-01
router.post("/register/verify",           authRateLimiter, validateBody(VerifyCodeDto),   authController.verifyRegistration);     // RF-02
router.post("/register/resend-code",      authRateLimiter, validateBody(EmailDto),        authController.resendRegistrationCode); // RF-04
router.post("/login",                     authRateLimiter, validateBody(LoginDto),        authController.login);                  // RF-03
router.post("/login/verify",              authRateLimiter, validateBody(VerifyCodeDto),   authController.verifyLogin);            // RF-03
router.post("/login/resend-code",         authRateLimiter, validateBody(EmailDto),        authController.resendLoginCode);        // RF-04
router.post("/refresh-token",                              validateBody(RefreshTokenDto), authController.refreshToken);           // RF-05

module.exports = router;
