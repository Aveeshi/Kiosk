const LANGUAGES = require('../model/languages');
const translations = require('../model/translations');

// GET /  -> language-select screen (the kiosk's landing page)
exports.getLanding = (req, res) => {
  res.render('landing', {
    title: 'Trividha · Choose your language',
    languages: LANGUAGES
  });
};

// POST /set-language -> stores the chosen language in a cookie, then
// sends the patient on to the home screen.
exports.setLanguage = (req, res) => {
  const { lang } = req.body;
  const isKnown = Object.prototype.hasOwnProperty.call(translations, lang);
  if (isKnown || LANGUAGES.some((l) => l.code === lang)) {
    res.cookie('lang', lang, { maxAge: 1000 * 60 * 60 * 8 }); // 8-hour kiosk shift
  }
  res.redirect('/home');
};

// GET /home -> "How would you like to check in today?" (kiosk or QR)
exports.getHome = (req, res) => {
  res.render('home', { title: 'Trividha · Home' });
};

// GET /login -> ABHA ID / mobile + OTP entry
exports.getLogin = (req, res) => {
  res.render('login', { title: 'Trividha · Log in' });
};

// GET /logout -> clears the kiosk session and returns to the home screen,
// ready for the next patient.
exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/home'));
};
