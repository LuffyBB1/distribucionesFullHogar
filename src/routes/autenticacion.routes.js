const express = require("express");
const Autenticacion = require("../controllers/autenticacion.controller");
const {JwtSchemeAuthorization} = require("../middleware/authentication.scheme");
const {ValidateLoginData} = require("../../utils/validateUserActionAccess");


const router = express.Router();
router.post("/login", ValidateLoginData,Autenticacion.login);
router.post("/logout",JwtSchemeAuthorization, Autenticacion.logout)

module.exports = router;