const express = require("express");
const {JwtSchemeAuthorization} = require("../middleware/authentication.scheme");
const {policyMiddlewareFactory} = require("../middleware/auth.claim.policy");
const Cliente = require("../controllers/clientes.controller");
const router = express.Router();

router.use(JwtSchemeAuthorization);
router.use(policyMiddlewareFactory("Admin"));

router.delete("/:id", Cliente.eliminarCliente);
router.get("/", Cliente.obtenerClientes);
router.get("/:id", Cliente.obtenerClientePorId)
router.post("/", Cliente.crearCliente);
router.patch("/:id", Cliente.editarCliente);

module.exports = router;