const SPECIALTIES = require('../model/specialties');

// Very small keyword classifier: picks the first specialty whose keyword
// list appears in the patient's free-text answers, falling back to
// General Medicine.
function matchSpecialty(text = '') {
  const lower = text.toLowerCase();
  for (const specialty of SPECIALTIES) {
    if (specialty.keywords.some((keyword) => lower.includes(keyword))) {
      return specialty;
    }
  }
  return SPECIALTIES[0];
}

module.exports = { matchSpecialty };
