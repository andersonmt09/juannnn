// ninguna expone el hash de la contraseña

class UserDto {
  constructor(user) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.emailVerified = user.emailVerified;
    this.createdDate = user.createdDate;
    this.updatedDate = user.updatedDate;
  }
}

class UserResponseDto {
  constructor(user) {
    this.ok = true;
    this.data = new UserDto(user);
  }
}

class UserListResponseDto {
  constructor({ users, total, page, limit }) {
    this.ok = true;
    this.data = users.map((user) => new UserDto(user));
    this.meta = { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }
}

module.exports = {
  UserDto,
  UserResponseDto,
  UserListResponseDto,
};
