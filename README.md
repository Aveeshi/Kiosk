# Trividha — Hospital Kiosk (MVC)

Express + EJS rewrite of the original single-page kiosk demo. The one
`index.html` + `script.js` + `styles.css` set is now a proper
Model–View–Controller app with four real pages instead of JS-only view
switching.

## Structure

```
Trividha/
├── app.js                    # entry point, middleware, i18n
├── router/
│   └── homeRouter.js         # all page + JSON API routes
├── controller/
│   ├── homeController.js     # landing / language / home / login pages
│   └── bookingController.js  # booking page + OTP + autobook APIs
├── model/
│   ├── languages.js          # 23-language list for the landing screen
│   ├── translations.js       # en / hi / mr UI dictionaries
│   ├── specialties.js        # keyword -> specialty map
│   └── questions.js          # AI Q&A wizard questions
├── utils/
│   ├── validators.js         # ABHA ID / mobile number check
│   ├── specialtyMatcher.js   # free-text -> specialty
│   └── slotFinder.js         # next open clinic slot
├── views/
│   ├── landing.ejs           # language select   (GET /)
│   ├── home.ejs               # kiosk or QR       (GET /home)
│   ├── login.ejs              # ABHA/OTP login    (GET /login)
│   ├── book-appointment.ejs   # menu + AI Q&A + confirm (GET /book-appointment)
│   ├── 404.ejs
│   └── partials/               # head, topbar, footer, modals
└── public/
    ├── css/styles.css
    └── js/                    # main.js (shared) + one file per page
```

## Pages ↔ original views

| New page                  | Route                | Replaces                                   |
|----------------------------|-----------------------|---------------------------------------------|
| `landing.ejs`              | `GET /`               | `#view-language`                             |
| `home.ejs`                 | `GET /home`           | `#view-home`                                 |
| `login.ejs`                | `GET /login`          | `#modal-kiosk` (was a modal, now a page)     |
| `book-appointment.ejs`     | `GET /book-appointment` | `#view-menu` + `#view-booking` (wizard)   |

The QR and Emergency overlays stayed as modals (`partials/qr-modal.ejs`,
`partials/emergency-modal.ejs`) since they're genuinely secondary, not
full pages.

## What moved server-side

- **Language switching** used to re-render `data-i18n` text in the
  browser on every keystroke. Now `POST /set-language` sets a cookie and
  every page is rendered server-side in that language via `res.locals.t`
  (`app.js`). Only the in-page AI Q&A wizard still needs the dictionary
  client-side (injected as `window.TRIVIDHA_DICT`), since it changes
  without a page reload.
- **OTP send/verify** are now `POST /api/send-otp` and
  `POST /api/verify-otp` (`controller/bookingController.js`) — still
  mocked (any 6-digit code succeeds), but wired through a real endpoint
  so swapping in an SMS gateway later is a one-file change.
- **Specialty matching + slot finding** moved to `utils/` and are called
  from `POST /api/autobook`, instead of running entirely in the browser.
- **Login state** is a real `express-session` cookie
  (`req.session.loggedIn`); `/book-appointment` redirects to `/login` if
  it's missing.

## Run it

```bash
npm install
npm start          # http://localhost:3000
# or: npm run dev   # nodemon, if you add it to devDependencies install
```

## Where to grow this into "the big project"

- Swap `model/*.js` static arrays for a real DB (Mongo/Postgres) behind
  the same function signatures.
- Replace the mock OTP in `bookingController.js` with a real SMS/ABHA
  gateway.
- Add a `controller/adminController.js` + `views/admin/` for staff to see
  the day's token queue.
- Add more languages to `model/translations.js` — every view already
  reads from `t`, so a new language needs no view changes.
