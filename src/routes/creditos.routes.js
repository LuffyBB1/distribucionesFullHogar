const express = require("express");
const Credito = require("../controllers/credito.controller");

const router = express.Router();

router.delete("/:id", Credito.eliminarCredito);
router.get("/", Credito.obtenerCreditoPorCliente);
router.patch("/:id", Credito.cambiarEstadoCredito);
router.post("/", Credito.crearCredito);
router.put("/:id", Credito.actualizarInformacionCredito);

module.exports = router;