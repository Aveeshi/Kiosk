const express = require("express");
const router = express.Router();

// The only page in the application is the Kiosk
router.get("/", (req, res) => res.render("kiosk"));
router.get("/kiosk", (req, res) => res.redirect("/"));

module.exports = router;
