// endpoints /api/events: solo la lista (método, ruta, filtros y DTO de petición)
const { Router } = require("express");
const { ROLES } = require("../config/configuracion");
const { authenticate, authenticateFromQuery, authorize } = require("../config/autenticacion");
const { validateRequest } = require("../config/validacion");
const { StreamRequestDto } = require("../esquemas/DTOs_Simulacion_Eventos");

// las funciones de cada endpoint están en esquemas/DTOs_Simulacion_Eventos.js
const { stream, ping } = require("../esquemas/DTOs_Simulacion_Eventos");

const router = Router();

// GET /api/events/stream?token= - admin
router.get("/stream", authenticateFromQuery, authorize(ROLES.ADMIN), validateRequest(StreamRequestDto), stream);
// POST /api/events/ping - admin
router.post("/ping", authenticate, authorize(ROLES.ADMIN), ping);

module.exports = { prefijo: "/events", router };
