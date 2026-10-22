// DTOs de respuesta de /api/users. Ninguno expone el hash de la contraseña.

// Datos públicos de un usuario (también se usa dentro de la respuesta de sesión).
class UserDto {
  constructor(user) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.emailVerified = user.emailVerified;
    this.isSample = user.isSample;
    this.createdDate = user.createdDate;
  }
}

// GET /api/users/:id, POST /api/users y PUT /api/users/:id → { ok, data }
class UserResponseDto {
  constructor(user) {
    this.ok = true;
    this.data = new UserDto(user);
  }
}

// GET /api/users → { ok, data: [], meta: { total, page, limit } }
class UserListResponseDto {
  constructor({ users, total, page, limit }) {
    this.ok = true;
    this.data = users.map((user) => new UserDto(user));
    this.meta = { total, page, limit };
  }
}

module.exports = { UserDto, UserResponseDto, UserListResponseDto };
