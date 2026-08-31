// An ABHA ID or an Aadhaar-linked mobile number are the only two
// identifiers accepted at the kiosk keypad: 10 digits (mobile) or
// 14 digits (ABHA number).
function isValidAbhaOrMobile(digits = '') {
  return digits.length === 10 || digits.length === 14;
}

module.exports = { isValidAbhaOrMobile };
