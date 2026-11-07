// endpoints /api/monitoring: solo la lista (método, ruta, filtros y DTO de petición)
const { Router } = require("express");
const { asyncHandler, ROLES } = require("../config/configuracion");
const { authenticate, authorize } = require("../config/autenticacion");
const { validateRequest } = require("../config/validacion");
const { CreateMonitoredEndpointRequestDto, MonitoredEndpointIdRequestDto } = require("../esquemas/DTOs_Monitoreo_Metricas");

// las funciones de cada endpoint están en esquemas/DTOs_Monitoreo_Metricas.js
const { listRoutes, list, getById, create, remove } = require("../esquemas/DTOs_Monitoreo_Metricas");

const router = Router();
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

// GET /api/monitoring/routes - admin
router.get("/routes", adminOnly, listRoutes);
// GET /api/monitoring/endpoints - con sesión
router.get("/endpoints", authenticate, asyncHandler(list));
// GET /api/monitoring/endpoints/:id - con sesión
router.get("/endpoints/:id", authenticate, validateRequest(MonitoredEndpointIdRequestDto), asyncHandler(getById));
// POST /api/monitoring/endpoints - admin
router.post("/endpoints", adminOnly, validateRequest(CreateMonitoredEndpointRequestDto), asyncHandler(create));
// DELETE /api/monitoring/endpoints/:id - admin
router.delete("/endpoints/:id", adminOnly, validateRequest(MonitoredEndpointIdRequestDto), asyncHandler(remove));

module.exports = { prefijo: "/monitoring", router };
