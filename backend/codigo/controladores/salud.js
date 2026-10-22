// Controlador de /api/health: estado de la API y de la base de datos externa (HealthResponseDto).
const healthService = require("../servicios/salud");
const asyncHandler = require("../utilidades/manejador-async");
const { HealthResponseDto } = require("../dtos/respuesta/salud");

const check = asyncHandler(async (req, res) => {
  const status = await healthService.check();
  res.status(status.databaseAvailable ? 200 : 503).json(new HealthResponseDto(status));
});

module.exports = { check };
