// Crea un usuario administrador.
// Uso: npm run crear-admin -- "Nombre" correo@dominio.com "Contraseña"
const bcrypt = require("bcryptjs");
const { validateEnvironment } = require("../configuracion/entorno");
const { closeConnection } = require("./conexion");
const User = require("../modelos/usuario");
const { ROLES } = require("../seguridad/constantes/roles");
const { SECURITY } = require("../seguridad/constantes/seguridad");
const { CreateUserDto } = require("../api/validadores/usuarios");

async function main() {
  validateEnvironment();
  const [name, email, password] = process.argv.slice(2);
  const dto = new CreateUserDto({ name, email, password, role: ROLES.ADMIN });
  const errors = dto.validate();
  if (errors.length) {
    console.error("Uso: npm run crear-admin -- \"Nombre\" correo@dominio.com \"Contraseña\"");
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
