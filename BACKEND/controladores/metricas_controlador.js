// endpoints /api (panel, estado y registros): solo la lista (método, ruta, filtros y DTO de petición)
const { Router } = require("express");
const { asyncHandler, ROLES } = require("../config/configuracion");
const { authenticate, authorize } = require("../config/autenticacion");
const { validateRequest } = require("../config/validacion");
const { ListRequestLogsRequestDto, RequestLogIdRequestDto } = require("../esquemas/DTOs_Monitoreo_Metricas");

// las funciones de cada endpoint están en esquemas/DTOs_Monitoreo_Metricas.js
const { getDashboard, listRequests, getRequest, getServices, checkHealth } = require("../esquemas/DTOs_Monitoreo_Metricas");

const router = Router();
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

// GET /api/health - público
router.get("/health", asyncHandler(checkHealth));
// GET /api/metrics/dashboard - admin
router.get("/metrics/dashboard", adminOnly, asyncHandler(getDashboard));
// GET /api/metrics/requests - admin
router.get("/metrics/requests", adminOnly, validateRequest(ListRequestLogsRequestDto), asyncHandler(listRequests));
// GET /api/metrics/requests/:id - admin
router.get("/metrics/requests/:id", adminOnly, validateRequest(RequestLogIdRequestDto), asyncHandler(getRequest));
// GET /api/metrics/services - admin
router.get("/metrics/services", adminOnly, asyncHandler(getServices));

module.exports = { prefijo: "", router };
