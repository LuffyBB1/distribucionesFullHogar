const express = require("express");
const {JwtSchemeAuthorization} = require("../middleware/authentication.scheme");
const {policyMiddlewareFactory} = require("../middleware/auth.claim.policy");
const Reportes = require("../controllers/reportes.controller");

const router = express.Router();

router.use(JwtSchemeAuthorization);
const adminPolicy = policyMiddlewareFactory("Admin");
const userPolicy = policyMiddlewareFactory("User");

router.get("/reportes/resumen", adminPolicy,Reportes.resumenFinancieroPeriodico);
router.get("/reportes/historial/:id",userPolicy  ,Reportes.historialCliente);
router.get("/reportes/resumen/clientes/:id",userPolicy  , Reportes.resumenCliente);
router.get("/reportes/estado_cuentas",adminPolicy ,Reportes.estadoFinancieroClientes);

module.exports = router;