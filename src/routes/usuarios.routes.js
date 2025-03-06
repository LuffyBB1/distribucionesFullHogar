const express = require("express");
const {JwtSchemeAuthorization} = require("../middleware/authentication.scheme");
const {policyMiddlewareFactory} = require("../middleware/auth.claim.policy");
const { validarParamsUuidId } = require("../../utils/validateReqParams");
const { actualizarUsuarioDto, crearUsuarioDto} = require("../../prisma/schema/dto/models.dto")

const Usuario = require("../controllers/usuario.controller");

const router = express.Router();

router.use(JwtSchemeAuthorization);
const adminPolicy = policyMiddlewareFactory("Admin");
const userPolicy = policyMiddlewareFactory("User");

router.get("/", adminPolicy, Usuario.obtenerUsuarios);
router.post("/", adminPolicy, crearUsuarioDto, Usuario.crearUsuario);
router.get("/:id", userPolicy, validarParamsUuidId, Usuario.obtenerUsuarioPorId);
router.patch("/:id", userPolicy, validarParamsUuidId, actualizarUsuarioDto, Usuario.actualizarUsuario);
router.delete("/:id", adminPolicy, validarParamsUuidId, Usuario.eliminarUsuario);

module.exports = router;


