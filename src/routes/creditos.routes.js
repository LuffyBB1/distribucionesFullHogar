const express = require("express");
const Credito = require("../controllers/credito.controller");
const {JwtSchemeAuthorization} = require("../middleware/authentication.scheme");
const {policyMiddlewareFactory} = require("../middleware/auth.claim.policy");
const { validarParamsIntId, validarQueryIntId } = require("../../utils/validateReqParams");
const { actualizarCreditoDto, crearCreditoDto } = require("../../prisma/schema/dto/models.dto")

const router = express.Router();

router.use(JwtSchemeAuthorization);
router.use(policyMiddlewareFactory("Admin"));

router.delete("/:id", validarParamsIntId, Credito.eliminarCredito);
router.get("/", validarQueryIntId, Credito.obtenerCreditoPorCliente);
router.patch("/:id", validarParamsIntId, Credito.cambiarEstadoCredito);
router.post("/", crearCreditoDto, Credito.crearCredito);
router.put("/:id", validarParamsIntId, actualizarCreditoDto, Credito.actualizarInformacionCredito);

module.exports = router;