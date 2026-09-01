const { Router } = require("express");
const { checkHealth, getPatients, lookupPatient } = require("../controller/patientController");
const { handleDialogue, handleSummarize } = require("../controller/intakeController");
const { createAlert, getAlerts, acknowledgeAlert } = require("../controller/emergencyController");

const router = Router();

// Health check
router.get("/health", checkHealth);

// Patients API
router.get("/patients", getPatients);
router.post("/patients/lookup", lookupPatient);

// Dialogue Manager API
router.post("/intake/dialogue", handleDialogue);
router.post("/intake/summarize", handleSummarize);

// Emergency Alert Webhook / Dispatcher API
router.post("/emergency/alert", createAlert);
router.get("/emergency/alerts", getAlerts);
router.post("/emergency/acknowledge", acknowledgeAlert);

module.exports = router;
