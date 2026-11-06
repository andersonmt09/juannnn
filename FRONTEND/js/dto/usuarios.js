import { clean, QueryRequestDto } from "./comunes.js";

export class ListUsersRequestDto extends QueryRequestDto {
  constructor({ page = 1, limit = 20 } = {}) {
    super();
    this.page = page;
    this.limit = limit;
  }
}

export class UserIdRequestDto {
  constructor({ id }) {
    this.id = id;
  }
}

export class CreateUserRequestDto {
  constructor({ name, email, role, password }) {
    this.name = clean(name);
    this.email = clean(email);
    this.role = role;
    this.password = password;
  }
}

// role undefined no se envía
export class UpdateUserRequestDto {
  constructor({ name, email, role }) {
    this.name = clean(name);
    this.email = clean(email);
    if (role !== undefined) this.role = role;
  }
}

// currentPassword solo al cambiar la propia
export class ChangePasswordRequestDto {
  constructor({ password, currentPassword }) {
    this.password = password;
    if (currentPassword !== undefined) this.currentPassword = currentPassword;
  }
}
