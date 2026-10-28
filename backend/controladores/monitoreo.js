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

module.exports = router;
