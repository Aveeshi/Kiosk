const { SAMPLE_PATIENTS } = require("../model/patientModel");

const checkHealth = (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
};

const getPatients = (req, res) => {
  res.json({ patients: SAMPLE_PATIENTS });
};

const lookupPatient = (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Query parameter required" });
  }

  const cleanQuery = query.toLowerCase().trim().replace(/[- ]/g, "");
  const found = SAMPLE_PATIENTS.find(
    (p) =>
      p.abhaId.replace(/[- ]/g, "").includes(cleanQuery) ||
      p.abhaAddress.toLowerCase().includes(cleanQuery) ||
      p.phone.replace(/[- ]/g, "").includes(cleanQuery) ||
      p.name.toLowerCase().includes(cleanQuery)
  );

  if (found) {
    res.json({ found: true, patient: found });
  } else {
    res.json({ found: false, message: "No existing ABHA records found. You can register as a new patient." });
  }
};

module.exports = {
  checkHealth,
  getPatients,
  lookupPatient
};
