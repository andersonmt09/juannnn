require("dotenv").config();
const bcrypt = require("bcryptjs");
const userRepository = require("./repositories/userRepository");
const endpointRepository = require("./repositories/endpointRepository");

(async () => {
  try {
    const adminEmail = "admin@axon.com";
    let admin = await userRepository.findByEmail(adminEmail);
    if (!admin) {
      const hash = await bcrypt.hash("Admin123!", 10);
      admin = await userRepository.create({
        name: "Administrador", email: adminEmail, passwordHash: hash,
        role: "admin", createdBy: null, isSample: false, emailVerified: true,
      });
      console.log("Admin creado:", adminEmail, "/ Admin123!");
    } else {
      console.log("Admin ya existe:", adminEmail);
    }

    const demoUsers = [
      { name: "Usuario Demo", email: "user@axon.com", password: "User123!", sample: false },
      { name: "Demo Protegido", email: "demo@axon.com", password: "Demo123!", sample: true },
    ];
    for (const d of demoUsers) {
      const exists = await userRepository.findByEmail(d.email);
      if (!exists) {
        const hash = await bcrypt.hash(d.password, 10);
        await userRepository.create({
          name: d.name, email: d.email, passwordHash: hash,
          role: "user", createdBy: admin.id, isSample: d.sample, emailVerified: true,
        });
        console.log(`Usuario creado: ${d.email} / ${d.password}${d.sample ? " (demo protegido)" : ""}`);
      } else {
        console.log("Ya existe:", d.email);
      }
    }

    // endpoints de ejemplo
    const eps = await endpointRepository.findAll();
    if (eps.length === 0) {
      await endpointRepository.create({ name: "Listar usuarios", path: "/api/users", method: "GET", description: "Lista usuarios activos" });
      await endpointRepository.create({ name: "Login", path: "/api/auth/login", method: "POST", description: "Inicio de sesión" });
      await endpointRepository.create({ name: "Dashboard métricas", path: "/api/metrics/dashboard", method: "GET", description: "Métricas del sistema" });
      console.log("Endpoints de ejemplo creados.");
    }

    console.log("Seed completado.");
    process.exit(0);
  } catch (e) {
    console.error("Seed error:", e.message);
    process.exit(1);
  }
})();
