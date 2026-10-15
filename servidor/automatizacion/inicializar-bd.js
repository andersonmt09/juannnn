// Crea las tablas en la base de datos externa con las credenciales de servidor/.env.
// Se ejecuta una sola vez: npm run inicializar-bd
// Si las tablas ya existen no las modifica.
const mysql = require("mysql2/promise");
const { env } = require("../codigo/configuracion/entorno");

const TABLES = [
  `CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin','user','inactive') NOT NULL DEFAULT 'user',
    email_verified TINYINT(1) NOT NULL DEFAULT 0,
    created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by_id BIGINT UNSIGNED NULL,
    is_sample TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_role (role),
    CONSTRAINT fk_users_created_by FOREIGN KEY (created_by_id) REFERENCES users (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS login_verification_codes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NULL,
    email VARCHAR(190) NOT NULL,
    purpose ENUM('login','registration') NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    used TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_codes_email (email),
    KEY idx_codes_expires (expires_at),
    CONSTRAINT fk_codes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS endpoints (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    path VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_endpoints_method (method)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS request_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    method VARCHAR(10) NOT NULL,
    path VARCHAR(255) NOT NULL,
    status_code INT NOT NULL,
    latency_ms INT NOT NULL DEFAULT 0,
    source VARCHAR(64),
    user_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_logs_created (created_at),
    KEY idx_logs_status (status_code),
    CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

async function main() {
  const { host, port, user, password, name, ssl } = env.database;
  if (!host || !user || !name) {
    console.error("Completa DB_HOST, DB_USER y DB_NAME en servidor/.env");
    process.exitCode = 1;
    return;
  }
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    console.error("DB_NAME solo puede tener letras, números y guiones bajos");
    process.exitCode = 1;
    return;
  }

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    ssl: ssl ? { rejectUnauthorized: true } : undefined,
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${name}\``);
    for (const statement of TABLES) await connection.query(statement);

    const [rows] = await connection.query("SHOW TABLES");
    console.log(`Base de datos "${name}" lista. Tablas:`, rows.map((row) => Object.values(row)[0]).join(", "));
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exitCode = 1;
});
