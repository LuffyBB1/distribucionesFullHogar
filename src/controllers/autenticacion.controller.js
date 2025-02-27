const { prisma } = require("../../prisma/database.client.prisma");
const bcrypt = require('bcrypt');
const { validateNotFoundInPrisma } = require("../../utils/validatemodels");
const {
    generatePayload,
    signToken,
    validateToken
} = require("../middleware/auth.jwt.handler");



const login = async (req, res)=> {
    try {
        const {email, password} = req.body;
        if (!(email && password)) { return res.status(400).json(); }
        const usuario = await prisma.usuario.findFirstOrThrow({
            where: {email: email}
        });
        bcrypt.compare(password, usuario.password, function(err, result) {
            try {
                if (result === true){
                    const payload = generatePayload(usuario.id_user);
                    const token = signToken(payload);
                    return res.status(200).json({token})                    
                }
                else {
                    throw new Error('contraseña inválida');
                }
                
            } catch (err){
                return res.status(401).json({ error: "Usuario o contraseña inválidos" });
            }
        });
    }catch(err){
        console.log(err);
        if (validateNotFoundInPrisma(err)) {
            return res.status(401).json({ error: "Usuario o contraseña inválidos" });
        }    
        return res.status(503).json({ error: "No se pudo contactar con el servicio" });
    }
}

const logout = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader.replace(RegExp("Bearer\\s+"), "");
        const payload = validateToken(token);
        const tokenBetado = await prisma.token.create({
            data: {
                jti: payload.jti
            }
        });
        if (tokenBetado) {
            return res.status(202).json();
        }
    } catch(err){
        console.error(err);
        return res.status(503).json();
    }
}

module.exports = {
    login,
    logout
}