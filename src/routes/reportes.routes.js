const express = require("express");
const Reportes = require("../controllers/reportes.controller");
const {obtenerClientePorId }= require("../controllers/clientes.controller");

const router = express.Router();

router.get("/reportes/resumen", Reportes.resumenFinancieroPeriodico);
router.get("/reportes/historial/:id", Reportes.historialCliente);
router.get("/reportes/resumen/clientes/:id", Reportes.resumenCliente);
router.get("/reportes/estado_cuentas", Reportes.estadoFinancieroClientes);

module.exports = router;