// DTO de petición (req) de /api/users: lo que envía el cliente, limpio.
import { clean, QueryRequestDto } from "./comunes.js";

// GET /api/users?page=&limit=
export class ListUsersRequestDto extends QueryRequestDto {
  constructor({ page = 1, limit = 20 } = {}) {
    super();
    this.page = page;
    this.limit = limit;
  }
}

// GET /api/users/:id y DELETE /api/users/:id (el id va en la URL)
export class UserIdRequestDto {
  constructor({ id }) {
    this.id = id;
  }
}

// POST /api/users
export class CreateUserRequestDto {
  constructor({ name, email, role, password }) {
    this.name = clean(name);
    this.email = clean(email);
    this.role = role;
    this.password = password;
  }
}

// PUT /api/users/:id — role undefined = no se envía (el rol propio no se cambia).
export class UpdateUserRequestDto {
  constructor({ name, email, role }) {
    this.name = clean(name);
    this.email = clean(email);
    if (role !== undefined) this.role = role;
  }
}

// PATCH /api/users/:id/password — currentPassword solo se envía al cambiar la contraseña propia.
export class ChangePasswordRequestDto {
  constructor({ password, currentPassword }) {
    this.password = password;
    if (currentPassword !== undefined) this.currentPassword = currentPassword;
  }
}
