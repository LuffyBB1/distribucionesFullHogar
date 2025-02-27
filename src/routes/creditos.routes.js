const express = require("express");
const Credito = require("../controllers/credito.controller");
const {JwtSchemeAuthorization} = require("../middleware/authentication.scheme");
const {policyMiddlewareFactory} = require("../middleware/auth.claim.policy");

const router = express.Router();

router.use(JwtSchemeAuthorization);
router.use(policyMiddlewareFactory("Admin"));

router.delete("/:id", Credito.eliminarCredito);
router.get("/", Credito.obtenerCreditoPorCliente);
router.patch("/:id", Credito.cambiarEstadoCredito);
router.post("/", Credito.crearCredito);
router.put("/:id", Credito.actualizarInformacionCredito);

module.exports = router;