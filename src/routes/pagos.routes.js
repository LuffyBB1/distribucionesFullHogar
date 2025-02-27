const express = require("express");
const { registrarPago, obtenerPagosCliente, modificarPago } = require("../controllers/pagos.controller");
const {JwtSchemeAuthorization} = require("../middleware/authentication.scheme");
const {policyMiddlewareFactory} = require("../middleware/auth.claim.policy");


const router = express.Router();

router.post("/", registrarPago);
router.get("/:id_cliente", obtenerPagosCliente);
router.put("/:id_pago", modificarPago);

module.exports = router;