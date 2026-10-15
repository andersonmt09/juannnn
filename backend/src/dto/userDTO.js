class CreateUserDTO {
  constructor({ name, email, password, role = "user" }) {
    this.name = (name || "").trim();
    this.email = (email || "").trim().toLowerCase();
    this.password = password;
    this.role = role === "admin" ? "admin" : "user";
  }
  validate() {
    const errors = [];
    if (!this.name || this.name.length < 2) errors.push("El nombre debe tener al menos 2 caracteres");
    if (!this.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) errors.push("El correo electrónico no es válido");
    if (!this.password || this.password.length < 6) errors.push("La contraseña debe tener al menos 6 caracteres");
    return { isValid: errors.length === 0, errors };
  }
}

class UpdateUserDTO {
  constructor({ name, email, role }) {
    this.name = name != null ? String(name).trim() : undefined;
    this.email = email != null ? String(email).trim().toLowerCase() : undefined;
    this.role = role != null ? (role === "admin" ? "admin" : "user") : undefined;
  }
  validate() {
    const errors = [];
    if (this.name !== undefined && this.name.length < 2) errors.push("El nombre debe tener al menos 2 caracteres");
    if (this.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) errors.push("El correo electrónico no es válido");
    return { isValid: errors.length === 0, errors };
  }
}

class UserResponseDTO {
  constructor(user) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.email_verified = !!user.email_verified;
    this.created_date = user.created_date;
    this.is_sample = !!user.is_sample;
  }
}

class LoginDTO {
  constructor({ email, password }) {
    this.email = (email || "").trim().toLowerCase();
    this.password = password;
  }
  validate() {
    const errors = [];
    if (!this.email) errors.push("El email es obligatorio");
    if (!this.password) errors.push("La contraseña es obligatoria");
    return { isValid: errors.length === 0, errors };
  }
}

module.exports = { CreateUserDTO, UpdateUserDTO, UserResponseDTO, LoginDTO };
