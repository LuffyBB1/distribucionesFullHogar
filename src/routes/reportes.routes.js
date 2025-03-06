const express = require("express");
const {JwtSchemeAuthorization} = require("../middleware/authentication.scheme");
const {policyMiddlewareFactory} = require("../middleware/auth.claim.policy");
const { validarParamsIntId } = require("../../utils/validateReqParams");
const { crearReportesDto } = require("../../prisma/schema/dto/models.dto")

const Reportes = require("../controllers/reportes.controller");

const router = express.Router();

router.use(JwtSchemeAuthorization);
const adminPolicy = policyMiddlewareFactory("Admin");
const userPolicy = policyMiddlewareFactory("User");

router.get("/reportes/estado_cuentas",adminPolicy , Reportes.estadoFinancieroClientes);
router.get("/reportes/resumen", adminPolicy, crearReportesDto, Reportes.resumenFinancieroPeriodico);
router.get("/reportes/resumen/clientes/:id",userPolicy, validarParamsIntId, Reportes.resumenCliente);
router.get("/reportes/historial/:id",userPolicy, validarParamsIntId ,Reportes.historialCliente);

module.exports = router;