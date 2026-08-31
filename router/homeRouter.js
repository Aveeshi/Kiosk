const express = require('express');
const router = express.Router();

const homeController = require('../controller/homeController');
const bookingController = require('../controller/bookingController');

// ---------- PAGES ----------
router.get('/', homeController.getLanding);
router.post('/set-language', homeController.setLanguage);

router.get('/home', homeController.getHome);
router.get('/login', homeController.getLogin);
router.get('/book-appointment', bookingController.getBookAppointment);
router.get('/logout', homeController.logout);

// ---------- JSON APIs (called by public/js/*.js) ----------
router.post('/api/send-otp', bookingController.sendOtp);
router.post('/api/verify-otp', bookingController.verifyOtp);
router.post('/api/autobook', bookingController.autoBook);

module.exports = router;
