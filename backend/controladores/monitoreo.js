// Endpoints de /api/monitoring: ver con sesión; agregar y quitar, administrador.
const { Router } = require("express");
const { asyncHandler, ROLES } = require("../configuracion");
const { authenticate, authorize } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");
const {
  CreateMonitoredEndpointRequestDto, MonitoredEndpointIdRequestDto,
  listRoutes, list, getById, create, remove,
} = require("../dto/monitoreo");

const router = Router();
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

// GET /api/monitoring/routes — administrador — rutas reales de la API
router.get("/routes", adminOnly, listRoutes);
// GET /api/monitoring/endpoints — con sesión — lista endpoints monitoreados
router.get("/endpoints", authenticate, asyncHandler(list));
// GET /api/monitoring/endpoints/:id — con sesión — detalle de un endpoint monitoreado
router.get("/endpoints/:id", authenticate, validateRequest(MonitoredEndpointIdRequestDto), asyncHandler(getById));
// POST /api/monitoring/endpoints — administrador — agrega un endpoint al monitoreo
router.post("/endpoints", adminOnly, validateRequest(CreateMonitoredEndpointRequestDto), asyncHandler(create));
// DELETE /api/monitoring/endpoints/:id — administrador — quita un endpoint del monitoreo
router.delete("/endpoints/:id", adminOnly, validateRequest(MonitoredEndpointIdRequestDto), asyncHandler(remove));

module.exports = router;
