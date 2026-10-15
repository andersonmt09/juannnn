const express = require("express");
const router = express.Router();
const { authMiddleware, requireRole } = require("../middleware/auth");
const axonController = require("../controllers/axonController");
router.use(authMiddleware);
router.get("/endpoints", axonController.listEndpoints);
router.post("/endpoints", requireRole("admin"), axonController.createEndpoint);
router.delete("/endpoints/:id", requireRole("admin"), axonController.deleteEndpoint);
module.exports = router;
