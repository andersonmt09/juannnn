// DTO de petición (req) comunes a toda la API: lo que envía el cliente, limpio y validado.
const { HttpError, SECURITY, isValidEmail } = require("../configuracion");

// ---------- Validaciones de campos (siempre devuelven una lista de errores, nunca lanzan) ----------

// Texto limpio: si es string lo recorta; si no, lo deja igual para que la validación lo rechace.
const cleanText = (value) => (typeof value === "string" ? value.trim() : value);

function nameErrors(name) {
  if (typeof name !== "string") return ["El nombre debe ser texto"];
  if (name.length < 2) return ["El nombre debe tener al menos 2 caracteres"];
  if (name.length > SECURITY.NAME_MAX_LENGTH) return [`El nombre no puede superar ${SECURITY.NAME_MAX_LENGTH} caracteres`];
  return [];
}

const emailErrors = (email) => (isValidEmail(email) ? [] : ["El correo electrónico no es válido"]);

function passwordErrors(password) {
  if (typeof password !== "string") return ["La contraseña debe ser texto"];
  const { PASSWORD_MIN_LENGTH: min, PASSWORD_MAX_LENGTH: max } = SECURITY;
  if (password.length < min || Buffer.byteLength(password) > max) return [`La contraseña debe tener entre ${min} y ${max} caracteres (las tildes y los emojis cuentan como más de uno)`];
  return [];
}

const codeErrors = (code) => (typeof code === "string" && /^\d{6}$/.test(code) ? [] : ["El código debe tener 6 dígitos"]);

// ---------- Base de las peticiones ----------

// Cada DTO de petición limpia los datos en el constructor y define validate().
class BaseRequestDto {
  // @returns {string[]} lista de errores (vacía si es válido)
  validate() {
    return [];
  }

  // Lanza 400 con todos los errores si los datos no son válidos.
  assertValid() {
    const errors = this.validate();
    if (errors.length) throw HttpError.badRequest(errors[0], errors);
    return this;
  }
}

module.exports = { cleanText, nameErrors, emailErrors, passwordErrors, codeErrors, BaseRequestDto  };
