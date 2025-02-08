const express = require("express");
const { obtenerClientes, crearCliente } = require("../controllers/clientes.controller");

const router = express.Router();

router.get("/", obtenerClientes);
router.post("/", crearCliente);

module.exports = router;