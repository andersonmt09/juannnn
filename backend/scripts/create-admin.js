/**
 * Crea el primer usuario administrador en la base de datos externa.
 * No guarda contraseñas en el código: se pasan al ejecutar el script.
 *
 * Uso:
 *   npm run create-admin -- "Nombre Apellido" correo@dominio.com "Contraseña"
 */
const bcrypt = require("bcryptjs");
const { validateEnvironment } = require("../src/config/environment");
const { closeConnection } = require("../src/config/database");
const User = require("../src/models/user.model");
const { ROLES } = require("../src/constants/roles");
const { SECURITY } = require("../src/constants/security");
const { CreateUserDto } = require("../src/dtos/user.dto");

async function main() {
  validateEnvironment();
  const [name, email, password] = process.argv.slice(2);
  const dto = new CreateUserDto({ name, email, password, role: ROLES.ADMIN });
  const errors = dto.validate();
  if (errors.length) {
    console.error("Uso: npm run create-admin -- \"Nombre\" correo@dominio.com \"Contraseña\"");
    errors.forEach((e) => console.error(" -", e));
    process.exitCode = 1;
    return;
  }

  if (await User.findByEmail(dto.email)) {
    console.log(`Ya existe un usuario con el correo ${dto.email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(dto.password, SECURITY.BCRYPT_ROUNDS);
  await User.create({ name: dto.name, email: dto.email, passwordHash, role: ROLES.ADMIN, emailVerified: true });
  console.log(`Administrador creado: ${dto.email}`);
}

main()
  .catch((error) => {
    console.error("Error:", error.message);
    process.exitCode = 1;
  })
  .finally(() => closeConnection().catch(() => {}));
