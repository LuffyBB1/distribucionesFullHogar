const express = require("express");
const Pago = require("../controllers/pagos.controller");
const {JwtSchemeAuthorization} = require("../middleware/authentication.scheme");
const {policyMiddlewareFactory} = require("../middleware/auth.claim.policy");
const { validarParamsIntId } = require("../../utils/validateReqParams");
const { actualizarPagoDto, crearPagoDto } = require("../../prisma/schema/dto/models.dto")

const router = express.Router();

router.use(JwtSchemeAuthorization);
router.use(policyMiddlewareFactory("Admin"));

router.post("/", crearPagoDto, Pago.registrarPago);
router.get("/clientes/:id", validarParamsIntId, Pago.obtenerPagosCliente);
router.put("/:id", validarParamsIntId, actualizarPagoDto, Pago.modificarPago);
router.delete("/:id", validarParamsIntId,  Pago.eliminarPago);

module.exports = router;