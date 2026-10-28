const { BaseRequestDto, cleanText, nameErrors, emailErrors, passwordErrors, codeErrors } = require("./comunes");
const { normalizeEmail, CODE_PURPOSE } = require("../configuracion");
const authService = require("../servicios/autenticacion");
const { MessageResponseDto } = require("../vistas/comunes");
const { VerificationRequiredResponseDto, EmailVerifiedResponseDto, SessionResponseDto } = require("../vistas/autenticacion");

class RegisterRequestDto extends BaseRequestDto {
  constructor({ name, email, password } = {}) {
    super();
    this.name = cleanText(name);
    this.email = normalizeEmail(email);
    this.password = password;
  }
  validate() {
    return [...nameErrors(this.name), ...emailErrors(this.email), ...passwordErrors(this.password)];
  }
}

class CredentialsRequestDto extends BaseRequestDto {
  constructor({ email, password } = {}) {
    super();
    this.email = normalizeEmail(email);
    this.password = password;
  }
  validate() {
    const errors = emailErrors(this.email);
    if (typeof this.password !== "string") errors.push("La contraseña debe ser texto");
    else if (!this.password) errors.push("La contraseña es obligatoria");
    else if (this.password.length > 1000) errors.push("La contraseña es demasiado larga");
    return errors;
  }
}

class VerifyCodeRequestDto extends BaseRequestDto {
  constructor({ email, code } = {}) {
    super();
    this.email = normalizeEmail(email);
    this.code = cleanText(code);
  }
  validate() {
    return [...emailErrors(this.email), ...codeErrors(this.code)];
  }
}

class ResendCodeRequestDto extends BaseRequestDto {
  constructor({ email } = {}) {
    super();
    this.email = normalizeEmail(email);
  }
  validate() {
    return emailErrors(this.email);
  }
}

class RefreshTokenRequestDto extends BaseRequestDto {
  constructor({ refreshToken } = {}) {
    super();
    this.refreshToken = refreshToken;
  }
  validate() {
    return typeof this.refreshToken === "string" && this.refreshToken ? [] : ["El refresh token es obligatorio"];
  }
}

async function register(req, res) {
  const result = await authService.register(req.dto);
  res.status(201).json(new VerificationRequiredResponseDto(result));
}

async function verifyRegistration(req, res) {
  await authService.verifyRegistration(req.dto);
  res.json(new EmailVerifiedResponseDto());
}

async function login(req, res) {
  const user = await authService.validateCredentials(req.dto);
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

module.exports = { RegisterRequestDto, CredentialsRequestDto, VerifyCodeRequestDto, ResendCodeRequestDto, RefreshTokenRequestDto, register, verifyRegistration, login, verifyLogin, resendLoginCode, resendRegistrationCode, refreshToken };
