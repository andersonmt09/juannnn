// Rutas de /api/monitoring (ver: con sesión; agregar y quitar: administrador).
const { Router } = require("express");
const monitoring = require("../controladores/monitoreo");
const views = require("../vistas/monitoreo");
const { authenticate, authorize } = require("../middlewares/autenticacion");
const { validateRequest } = require("../middlewares/validacion");
const { ROLES } = require("../configuracion");

const router = Router();
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

router.get("/routes", adminOnly, monitoring.listRoutes);
router.get("/endpoints", authenticate, monitoring.list);
router.post("/endpoints", adminOnly, validateRequest(views.CreateMonitoredEndpointRequestDto), monitoring.create);
router.delete("/endpoints/:id", adminOnly, validateRequest(views.MonitoredEndpointIdRequestDto), monitoring.remove);

module.exports = router;
