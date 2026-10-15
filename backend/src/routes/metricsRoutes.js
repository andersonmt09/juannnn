const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const metricsController = require("../controllers/metricsController");
router.use(authMiddleware);
router.get("/dashboard", metricsController.dashboard);
module.exports = router;
