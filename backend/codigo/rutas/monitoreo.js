// Rutas de monitoreo: /api/monitoring (requieren sesión; crear y eliminar solo el administrador)
const { Router } = require("express");
const monitoringController = require("../controladores/monitoreo");
const { authenticate } = require("../middlewares/autenticacion");
const { authorize } = require("../middlewares/roles");
const { validateRequest } = require("../middlewares/validacion");
const { CreateMonitoredEndpointRequestDto, MonitoredEndpointIdRequestDto } = require("../dtos/peticion/monitoreo");
const { ROLES } = require("../constantes/roles");

const router = Router();
const adminOnly = authorize(ROLES.ADMIN);

router.use(authenticate);

router.get("/routes", adminOnly, monitoringController.listRoutes);
router.get("/endpoints", monitoringController.list);
router.post("/endpoints", adminOnly, validateRequest(CreateMonitoredEndpointRequestDto), monitoringController.create);
router.delete("/endpoints/:id", adminOnly, validateRequest(MonitoredEndpointIdRequestDto), monitoringController.remove);

module.exports = router;
