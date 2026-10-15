const bcrypt = require("bcryptjs");
const userRepository = require("../repositories/userRepository");
const { CreateUserDTO, UpdateUserDTO } = require("../dto/userDTO");
const UserResponseDTO = require("../dto/userDTO").UserResponseDTO;

class UserService {
  async list({ includeInactive = false, page, limit } = {}) {
    const result = await userRepository.findAll({ includeInactive, page, limit });
    return {
      data: result.data.map((u) => new UserResponseDTO(u)),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  async get(id) {
    const user = await userRepository.findById(id);
    if (!user || user.role === "inactive") {
      const err = new Error("Usuario no encontrado");
      err.statusCode = 404;
      throw err;
    }
    return new UserResponseDTO(user);
  }

  async create(data, createdBy) {
    const dto = new CreateUserDTO(data);
    const v = dto.validate();
    if (!v.isValid) {
      const err = new Error(v.errors[0]);
      err.statusCode = 400;
      err.errors = v.errors;
      throw err;
    }
    const existing = await userRepository.findByEmail(dto.email);
    if (existing) {
      const err = new Error("El correo ya está registrado");
      err.statusCode = 409;
      throw err;
    }
    const hash = await bcrypt.hash(dto.password, 10);
    // Usuarios creados por admin se consideran verificados
    const user = await userRepository.create({
      name: dto.name, email: dto.email, passwordHash: hash, role: dto.role,
      createdBy, isSample: false, emailVerified: true,
    });
    return new UserResponseDTO(user);
  }

  async update(id, data) {
    const user = await userRepository.findById(id);
    if (!user || user.role === "inactive") {
      const err = new Error("Usuario no encontrado");
      err.statusCode = 404;
      throw err;
    }
    const dto = new UpdateUserDTO(data);
    const v = dto.validate();
    if (!v.isValid) {
      const err = new Error(v.errors[0]);
      err.statusCode = 400;
      err.errors = v.errors;
      throw err;
    }
    const fields = {};
    if (dto.name !== undefined) fields.name = dto.name;
    if (dto.email !== undefined) {
      if (dto.email !== user.email) {
        const existing = await userRepository.findByEmail(dto.email);
        if (existing && existing.id !== user.id) {
          const err = new Error("El correo ya está en uso");
          err.statusCode = 409;
          throw err;
        }
      }
      fields.email = dto.email;
    }
    if (dto.role !== undefined) fields.role = dto.role;
    const updated = await userRepository.update(id, fields);
    return new UserResponseDTO(updated);
  }

  async changePassword(id, password, requester) {
    if (!password || password.length < 6) {
      const err = new Error("La contraseña debe tener al menos 6 caracteres");
      err.statusCode = 400;
      throw err;
    }
    const user = await userRepository.findById(id);
    if (!user || user.role === "inactive") {
      const err = new Error("Usuario no encontrado");
      err.statusCode = 404;
      throw err;
    }
    // si no es admin, solo puede cambiar su propia contraseña
    if (requester && requester.role !== "admin" && requester.id !== user.id) {
      const err = new Error("Sin permisos");
      err.statusCode = 403;
      throw err;
    }
    const hash = await bcrypt.hash(password, 10);
    const updated = await userRepository.updatePassword(id, hash);
    return new UserResponseDTO(updated);
  }

  async remove(id, requesterId) {
    const user = await userRepository.findById(id);
    if (!user || user.role === "inactive") {
      const err = new Error("Usuario no encontrado");
      err.statusCode = 404;
      throw err;
    }
    if (user.is_sample) {
      const err = new Error("Los usuarios demo no se pueden eliminar");
      err.statusCode = 400;
      throw err;
    }
    if (requesterId && Number(requesterId) === Number(user.id)) {
      const err = new Error("No puedes eliminar tu propio usuario");
      err.statusCode = 400;
      throw err;
    }
    if (user.role === "admin") {
      // opcional: evitar eliminar todos los admins? skip simple
    }
    await userRepository.softDelete(id);
    return { message: "Usuario eliminado (lógicamente)" };
  }
}

module.exports = new UserService();
