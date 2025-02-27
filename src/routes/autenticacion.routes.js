const express = require("express");
const router = express.Router();
const Autenticacion = require("../controllers/autenticacion.controller");
const {JwtSchemeAuthorization} = require("../middleware/authentication.scheme");

router.post("/login", Autenticacion.login);
router.post("/logout",JwtSchemeAuthorization, Autenticacion.logout)

module.exports = router;