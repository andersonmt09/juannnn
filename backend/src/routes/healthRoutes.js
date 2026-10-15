const express = require("express");
const router = express.Router();
router.get("/", (req, res) => res.json({ ok: true, status: "ok", service: "axon-backend" }));
module.exports = router;
