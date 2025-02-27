const express = require("express");
const Pago = require("../controllers/pagos.controller");
const {JwtSchemeAuthorization} = require("../middleware/authentication.scheme");
const {policyMiddlewareFactory} = require("../middleware/auth.claim.policy");

const router = express.Router();

router.use(JwtSchemeAuthorization);
router.use(policyMiddlewareFactory("Admin"));

router.post("/", Pago.registrarPago);
router.get("/clientes/:id", Pago.obtenerPagosCliente);
router.put("/:id", Pago.modificarPago);
router.delete("/:id", Pago.eliminarPago);

module.exports = router;