const express = require("express");
const {JwtSchemeAuthorization} = require("../middleware/authentication.scheme");
const {policyMiddlewareFactory} = require("../middleware/auth.claim.policy");
const Usuario = require("../controllers/usuario.controller");

const router = express.Router();

router.use(JwtSchemeAuthorization);
const adminPolicy = policyMiddlewareFactory("Admin");
const userPolicy = policyMiddlewareFactory("User");

router.get("/", adminPolicy, Usuario.obtenerUsuarios);
router.post("/", adminPolicy, Usuario.crearUsuario);
router.get("/:id", userPolicy, Usuario.obtenerUsuarioPorId);
router.patch("/:id", userPolicy ,Usuario.actualizarUsuario);
router.delete("/:id", adminPolicy, Usuario.eliminarUsuario);

module.exports = router;


