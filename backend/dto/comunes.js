const { HttpError, SECURITY, isValidEmail } = require("../configuracion");

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

// cada DTO limpia en el constructor y define validate()
class BaseRequestDto {
  validate() {
    return [];
  }

  assertValid() {
    const errors = this.validate();
    if (errors.length) throw HttpError.badRequest(errors[0], errors);
    return this;
  }
}

module.exports = { cleanText, nameErrors, emailErrors, passwordErrors, codeErrors, BaseRequestDto  };
