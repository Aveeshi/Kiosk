const QUESTIONS = require('../model/questions');
const { isValidAbhaOrMobile } = require('../utils/validators');
const { matchSpecialty } = require('../utils/specialtyMatcher');
const { nextAvailableSlot } = require('../utils/slotFinder');

// GET /book-appointment -> post-login menu + AI Q&A wizard + confirmation.
// Requires a verified session (see verifyOtp below); otherwise send the
// patient back to log in first.
exports.getBookAppointment = (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect('/login');
  }
  res.render('book-appointment', {
    title: 'Trividha · Book Appointment',
    questions: QUESTIONS
  });
};

// POST /api/send-otp  { idDigits }
// Mock OTP dispatch: validates the ID and "sends" a code to a masked
// number. Swap the mock with a real SMS gateway + OTP store later.
exports.sendOtp = (req, res) => {
  const { idDigits = '' } = req.body;

  if (!isValidAbhaOrMobile(idDigits)) {
    return res.status(400).json({
      ok: false,
      message: 'Enter a valid ABHA ID or 10-digit mobile number.'
    });
  }

  req.session.pendingId = idDigits;
  const last4 = idDigits.slice(-4);
  res.json({ ok: true, maskedNumber: `+91 XXXXX ${last4.padStart(4, 'X')}` });
};

// POST /api/verify-otp  { otp }
// Mock verification: any complete 6-digit code succeeds, matching the
// original kiosk demo behaviour. Marks the kiosk session as logged in.
exports.verifyOtp = (req, res) => {
  const { otp = '' } = req.body;

  if (otp.length !== 6) {
    return res.status(400).json({
      ok: false,
      message: "That code didn't match. Try again."
    });
  }

  req.session.loggedIn = true;
  delete req.session.pendingId;
  res.json({ ok: true, redirect: '/book-appointment' });
};

// POST /api/autobook  { symptoms, duration, severity }
// Matches the patient's free-text answers to a specialty and finds the
// next open slot, returning a token for the confirmation screen.
exports.autoBook = (req, res) => {
  if (!req.session.loggedIn) {
    return res.status(401).json({ ok: false, message: 'Please log in first.' });
  }

  const { symptoms = '', duration = '' } = req.body;
  const specialty = matchSpecialty(`${symptoms} ${duration}`);
  const slot = nextAvailableSlot(new Date());
  const dateLabel = slot.date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
  const token = 'T' + Math.floor(100 + Math.random() * 900);

  res.json({
    ok: true,
    specialty: specialty.label,
    when: `${dateLabel}, ${slot.time}`,
    token
  });
};
