-- ============================================================
--  AXON Stack Flow - Script de creación de la base de datos
--  Motor: MySQL 8
--
--  IMPORTANTE: este script se ejecuta UNA VEZ en el servidor de
--  base de datos EXTERNO por su administrador. La aplicación no
--  crea ni contiene la base de datos; solo se conecta a ella con
--  las credenciales de backend/.env.
--
--  Ver modelo-datos.md para el diagrama entidad-relación y el
--  diccionario de datos.
-- ============================================================

CREATE DATABASE IF NOT EXISTS axon_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE axon_db;

-- ------------------------------------------------------------
-- users: usuarios del sistema (RF-01, RF-06 a RF-10)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name            VARCHAR(120)    NOT NULL,
  email           VARCHAR(190)    NOT NULL,
  password_hash   VARCHAR(255)    NOT NULL,
  role            ENUM('admin','user','inactive') NOT NULL DEFAULT 'user',
  email_verified  TINYINT(1)      NOT NULL DEFAULT 0,
  created_date    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by_id   BIGINT UNSIGNED NULL,
  is_sample       TINYINT(1)      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role),
  CONSTRAINT fk_users_created_by FOREIGN KEY (created_by_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- login_verification_codes: códigos enviados por correo (RF-02, RF-03, RF-04)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS login_verification_codes (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NULL,
  email       VARCHAR(190)    NOT NULL,
  purpose     ENUM('login','registration') NOT NULL,
  code_hash   VARCHAR(255)    NOT NULL,
  expires_at  DATETIME        NOT NULL,
  attempts    INT             NOT NULL DEFAULT 0,
  used        TINYINT(1)      NOT NULL DEFAULT 0,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_codes_email (email),
  KEY idx_codes_expires (expires_at),
  CONSTRAINT fk_codes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- endpoints: endpoints registrados para monitoreo (RF-12, RF-13)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS endpoints (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name         VARCHAR(120)    NOT NULL,
  path         VARCHAR(255)    NOT NULL,
  method       VARCHAR(10)     NOT NULL,
  description  TEXT,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_endpoints_method (method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- request_logs: registro de cada petición a la API (RF-11, RF-14)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS request_logs (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  method       VARCHAR(10)     NOT NULL,
  path         VARCHAR(255)    NOT NULL,
  status_code  INT             NOT NULL,
  latency_ms   INT             NOT NULL DEFAULT 0,
  source       VARCHAR(64),
  user_id      BIGINT UNSIGNED NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_logs_created (created_at),
  KEY idx_logs_status (status_code),
  CONSTRAINT fk_logs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
