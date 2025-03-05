const express = require("express");
const {JwtSchemeAuthorization} = require("../middleware/authentication.scheme");
const {policyMiddlewareFactory} = require("../middleware/auth.claim.policy");
const { validarParamsIntId } = require("../../utils/validateReqParams");
const { actualizarClienteDto, crearClienteDto } = require("../../prisma/schema/dto/models.dto")
const Cliente = require("../controllers/clientes.controller");




const router = express.Router();

router.use(JwtSchemeAuthorization);
router.use(policyMiddlewareFactory("Admin"));

router.delete("/:id", validarParamsIntId, Cliente.eliminarCliente);
router.get("/", Cliente.obtenerClientes);
router.get("/:id", validarParamsIntId, Cliente.obtenerClientePorId)
router.post("/", crearClienteDto, Cliente.crearCliente);
router.patch("/:id", validarParamsIntId, actualizarClienteDto, Cliente.editarCliente);

module.exports = router;