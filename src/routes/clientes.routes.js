const express = require("express");
const Cliente = require("../controllers/clientes.controller");

const router = express.Router();

router.delete("/:id", Cliente.eliminarCliente);
router.get("/", Cliente.obtenerClientes);
router.get("/:id", Cliente.obtenerClientePorId)
router.post("/", Cliente.crearCliente);
router.patch("/:id", Cliente.editarCliente);

module.exports = router;