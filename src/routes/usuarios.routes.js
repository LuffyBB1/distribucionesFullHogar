const express = require("express");
const Usuario = require("../controllers/usuario.controller");

const router = express.Router();
const {JwtSchemeAuthorization} = require("../middleware/authentication.scheme");
const {policyMiddlewareFactory} = require("../middleware/auth.claim.policy");



router.use(JwtSchemeAuthorization);
router.use(policyMiddlewareFactory(["User", "Admin"]));
router.get("/", Usuario.obtenerUsuarios);
router.post("/", Usuario.crearUsuario);
router.get("/:id", Usuario.obtenerUsuarioPorId);
router.patch("/:id", Usuario.actualizarUsuario);
router.delete("/:id", Usuario.eliminarUsuario)

module.exports = router;


