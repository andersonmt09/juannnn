// datos iniciales: crea el primer administrador. Uso: npm run crear-admin -- "Nombre" correo@dominio.com "Contraseña"
const { validateEnvironment, ROLES } = require("../config/configuracion");
const userService = require("./usuarios");
const { CreateUserRequestDto } = require("../esquemas/DTOs_Usuarios_Autenticacion");

async function main() {
  validateEnvironment();
  const [name, email, password] = process.argv.slice(2);
  const dto = new CreateUserRequestDto({ name, email, password, role: ROLES.ADMIN });
  const errors = dto.validate();
  if (errors.length) {
    console.error("Uso: npm run crear-admin -- \"Nombre\" correo@dominio.com \"Contraseña\"");
    errors.forEach((e) => console.error(" -", e));
    process.exitCode = 1;
    return;
  }

  try {
    await userService.create(dto, null);
    console.log(`Administrador creado: ${dto.email}`);
  } catch (error) {
    if (error.statusCode !== 409) throw error;
    console.log(`Ya existe un usuario con el correo ${dto.email}`);
  }
}

main()
  .catch((error) => {
    console.error("Error:", error.message);
    process.exitCode = 1;
  });
