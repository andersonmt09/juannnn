const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const userRepository = require("../repositories/userRepository");
const loginCodeRepository = require("../repositories/loginCodeRepository");
const { sendVerificationCode } = require("./emailService");
const LoginDTO = require("../dto/userDTO").LoginDTO;
const CreateUserDTO = require("../dto/userDTO").CreateUserDTO;
const UserResponseDTO = require("../dto/userDTO").UserResponseDTO;

const CODE_EXPIRY_MIN = 5;
const CODE_MAX_ATTEMPTS = 5;
const IP_WINDOW_MS = 15 * 60 * 1000;
const IP_MAX_ATTEMPTS = 5;

const ipAttempts = new Map();

class AuthService {
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  checkIpRateLimit(ip) {
    const now = Date.now();
    let rec = ipAttempts.get(ip);
    if (!rec || now - rec.start > IP_WINDOW_MS) {
      rec = { start: now, count: 0 };
      ipAttempts.set(ip, rec);
    }
    rec.count += 1;
    if (rec.count > IP_MAX_ATTEMPTS) {
      const retryAfter = Math.ceil((IP_WINDOW_MS - (now - rec.start)) / 1000);
      const err = new Error("Demasiados intentos. Intente más tarde.");
      err.statusCode = 429;
      err.retryAfter = retryAfter;
      throw err;
    }
  }

  resetIpRateLimit(ip) {
    ipAttempts.delete(ip);
  }

  generateCode() {
    // 6 dígitos, con ceros a la izquierda
    const n = crypto.randomInt(0, 1000000);
    return String(n).padStart(6, "0");
  }

  async issueTokens(user) {
    const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "8h" });
    const refreshToken = jwt.sign({ id: user.id, jti: uuidv4() }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    });
    return { token, refreshToken };
  }

  async login(email, password, clientIp) {
    const dto = new LoginDTO({ email, password });
    const v = dto.validate();
    if (!v.isValid) {
      const err = new Error(v.errors[0]);
      err.statusCode = 400;
      throw err;
    }
    if (!this.isValidEmail(dto.email)) {
      const err = new Error("Formato de correo electrónico inválido");
      err.statusCode = 400;
      throw err;
    }
    this.checkIpRateLimit(clientIp);

    const user = await userRepository.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password_hash))) {
      const err = new Error("Credenciales incorrectas");
      err.statusCode = 401;
      throw err;
    }
    if (user.role === "inactive") {
      const err = new Error("La cuenta está desactivada");
      err.statusCode = 403;
      throw err;
    }
    if (!user.email_verified) {
      const err = new Error("Debes verificar tu correo electrónico primero");
      err.statusCode = 403;
      throw err;
    }

    // invalidar códigos anteriores e generar nuevo
    await loginCodeRepository.invalidateAll(dto.email, "login");
    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MIN * 60 * 1000);
    await loginCodeRepository.create({ userId: user.id, email: dto.email, purpose: "login", codeHash, expiresAt });
    await sendVerificationCode(dto.email, code, "login");

    this.resetIpRateLimit(clientIp);
    return { ok: true, requiresVerification: true, email: dto.email };
  }

  async verifyCode(email, code) {
    email = (email || "").trim().toLowerCase();
    if (!email || !code) {
      const err = new Error("Email y código son obligatorios");
      err.statusCode = 400;
      throw err;
    }
    const record = await loginCodeRepository.findActive(email, "login");
    if (!record) {
      const err = new Error("Código inválido o expirado");
      err.statusCode = 401;
      throw err;
    }
    if (record.attempts >= CODE_MAX_ATTEMPTS) {
      const err = new Error("Demasiados intentos para este código");
      err.statusCode = 429;
      throw err;
    }
    await loginCodeRepository.incrementAttempts(record.id);
    const ok = await bcrypt.compare(code, record.code_hash);
    if (!ok) {
      const err = new Error("Código incorrecto");
      err.statusCode = 401;
      throw err;
    }
    await loginCodeRepository.markUsed(record.id);

    const user = await userRepository.findByEmail(email);
    if (!user) {
      const err = new Error("Usuario no encontrado");
      err.statusCode = 404;
      throw err;
    }
    const tokens = await this.issueTokens(user);
    return { ok: true, ...tokens, user: new UserResponseDTO(user) };
  }

  async register(name, email, password) {
    const dto = new CreateUserDTO({ name, email, password, role: "user" });
    const v = dto.validate();
    if (!v.isValid) {
      const err = new Error(v.errors[0]);
      err.statusCode = 400;
      err.errors = v.errors;
      throw err;
    }
    if (!this.isValidEmail(dto.email)) {
      const err = new Error("Formato de correo electrónico inválido");
      err.statusCode = 400;
      throw err;
    }
    const existing = await userRepository.findByEmail(dto.email);
    if (existing) {
      const err = new Error("El correo ya está registrado");
      err.statusCode = 409;
      throw err;
    }
    const hash = await bcrypt.hash(dto.password, 10);
    const user = await userRepository.create({ name: dto.name, email: dto.email, passwordHash: hash, role: "user" });

    await loginCodeRepository.invalidateAll(dto.email, "registration");
    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MIN * 60 * 1000);
    await loginCodeRepository.create({ userId: user.id, email: dto.email, purpose: "registration", codeHash, expiresAt });
    await sendVerificationCode(dto.email, code, "registration");

    return { ok: true, requiresVerification: true, email: dto.email };
  }

  async verifyRegistration(email, code) {
    email = (email || "").trim().toLowerCase();
    if (!email || !code) {
      const err = new Error("Email y código son obligatorios");
      err.statusCode = 400;
      throw err;
    }
    const record = await loginCodeRepository.findActive(email, "registration");
    if (!record) {
      const err = new Error("Código inválido o expirado");
      err.statusCode = 401;
      throw err;
    }
    if (record.attempts >= CODE_MAX_ATTEMPTS) {
      const err = new Error("Demasiados intentos para este código");
      err.statusCode = 429;
      throw err;
    }
    await loginCodeRepository.incrementAttempts(record.id);
    const ok = await bcrypt.compare(code, record.code_hash);
    if (!ok) {
      const err = new Error("Código incorrecto");
      err.statusCode = 401;
      throw err;
    }
    await loginCodeRepository.markUsed(record.id);
    await userRepository.setEmailVerified(email, 1);
    return { ok: true, verified: true };
  }

  async resendCode(email) {
    email = (email || "").trim().toLowerCase();
    const user = await userRepository.findByEmail(email);
    if (!user) {
      const err = new Error("Usuario no encontrado");
      err.statusCode = 404;
      throw err;
    }
    if (user.role === "inactive") {
      const err = new Error("Cuenta desactivada");
      err.statusCode = 403;
      throw err;
    }
    await loginCodeRepository.invalidateAll(email, "login");
    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MIN * 60 * 1000);
    await loginCodeRepository.create({ userId: user.id, email, purpose: "login", codeHash, expiresAt });
    await sendVerificationCode(email, code, "login");
    return { ok: true, message: "Código reenviado" };
  }

  async resendRegistration(email) {
    email = (email || "").trim().toLowerCase();
    const user = await userRepository.findByEmail(email);
    if (!user) {
      const err = new Error("Usuario no encontrado");
      err.statusCode = 404;
      throw err;
    }
    await loginCodeRepository.invalidateAll(email, "registration");
    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MIN * 60 * 1000);
    await loginCodeRepository.create({ userId: user.id, email, purpose: "registration", codeHash, expiresAt });
    await sendVerificationCode(email, code, "registration");
    return { ok: true, message: "Código reenviado" };
  }

  async refreshToken(refreshToken) {
    if (!refreshToken) {
      const err = new Error("Refresh token requerido");
      err.statusCode = 401;
      throw err;
    }
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (e) {
      const err = new Error("Refresh token inválido o expirado");
      err.statusCode = 401;
      throw err;
    }
    const user = await userRepository.findById(payload.id);
    if (!user || user.role === "inactive") {
      const err = new Error("Usuario no válido");
      err.statusCode = 401;
      throw err;
    }
    const tokens = await this.issueTokens(user);
    return { ok: true, ...tokens, user: new UserResponseDTO(user) };
  }
}

module.exports = new AuthService();
