// DTO de salida de un usuario: solo datos públicos, nunca el hash de la contraseña.
class UserResponseDto {
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

module.exports = { UserResponseDto };
