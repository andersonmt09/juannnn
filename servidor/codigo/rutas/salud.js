// Ruta pública de estado: /api/health
const { Router } = require("express");
const healthController = require("../controladores/salud");

const router = Router();

router.get("/", healthController.check);

module.exports = router;
