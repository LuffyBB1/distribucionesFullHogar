const express = require("express");
const Cliente = require("../controllers/clientes.controller");
const {JwtSchemeAuthorization} = require("../middleware/authentication.scheme");
const {policyMiddlewareFactory} = require("../middleware/auth.claim.policy");
const router = express.Router();

// router.use(JwtSchemeAuthorization);
// router.use(policyMiddlewareFactory("Admin"));
router.post("/token", (req, res)=>{
    console.log(tokenValidationParams);

    console.log(validatedToken);
    return res.status(200).json({token, validateToken});
})
router.delete("/:id", Cliente.eliminarCliente);
router.get("/", Cliente.obtenerClientes);
router.get("/:id", Cliente.obtenerClientePorId)
router.post("/", Cliente.crearCliente);
router.patch("/:id", Cliente.editarCliente);

module.exports = router;