// routes/compilerRoutes.js
const express = require("express");
const router = express.Router();
const { executeCode, getAiAssistance } = require("../controllers/compilerController");

// Route Definitions
router.post("/execute", executeCode);
router.post("/analyze", getAiAssistance);

module.exports = router;