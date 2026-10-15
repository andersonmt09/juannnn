const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/login", authController.login);
router.post("/verify-code", authController.verifyCode);
router.post("/register", authController.register);
router.post("/verify-registration", authController.verifyRegistration);
router.post("/resend-code", authController.resendCode);
router.post("/resend-registration", authController.resendRegistration);
router.post("/refresh-token", authController.refreshToken);

module.exports = router;
