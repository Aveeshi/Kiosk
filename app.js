const path = require('path');
require("dotenv").config();
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const translations = require('./model/translations');
const LANGUAGES = require('./model/languages');
const homeRouter = require('./router/homeRouter');

const app = express();

// ---------- VIEW ENGINE ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---------- CORE MIDDLEWARE ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,   // move to process.env.SESSION_SECRET in production
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 1 } // 1 min kiosk session
}));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- i18n MIDDLEWARE ----------
// Reads the language the patient picked on the landing page (stored in a
// cookie) and exposes it + the matching dictionary to every EJS view as
// `currentLang`, `currentLangMeta` and `t`, so pages never hardcode English.
app.use((req, res, next) => {
  const lang = req.cookies.lang || 'en';
  res.locals.currentLang = lang;
  res.locals.t = translations[lang] || translations.en;
  res.locals.currentLangMeta =
    LANGUAGES.find((l) => l.code === lang) || LANGUAGES.find((l) => l.code === 'en');
  next();
});

// ---------- ROUTES ----------
app.use('/', homeRouter);

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Trividha kiosk running on http://localhost:${PORT}`);
});
