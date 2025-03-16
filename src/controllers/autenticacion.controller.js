const { prisma } = require("../../prisma/database.client.prisma");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
const { validateNotFoundInPrisma } = require("../../utils/validatemodels");
const { generatePayload, signToken, validateToken } = require("../middleware/auth.jwt.handler");
const { loggerMiddleware } = require("../logging/logger");


/**
 * Permite el acceso al sistema por parte de usuarios registrados 
 */
const login = async (req, res)=> {
    try {       
        /**
         * Se verifica que el resultado del middleware de validación de parámetros de la petición (i.e request.params, body o request.query)
         * no contenga errores
         */
        if (!validationResult(req).isEmpty()) { 
            loggerMiddleware.info(`Model Validation failed: ${validationResult(req)}`);
            return res.status(400).json(); 
        }
        const usuario = await prisma.usuario.findFirstOrThrow({
            where: {email: req.body.email}
        });
        bcrypt.compare(req.body.password, usuario.password, function(err, result) {
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
                loggerMiddleware.error(err.message);
                return res.status(401).json({ error: "Usuario o contraseña inválidos" });
            }
        });
    }catch(err){        
        if (validateNotFoundInPrisma(err)) {
            loggerMiddleware.error(err.message);
            return res.status(401).json({ error: "Usuario o contraseña inválidos" });
        }    
        loggerMiddleware.error(err.message);
        return res.status(503).json({ error: "No se pudo contactar con el servicio" });
    }
}
/**
 * Permite cerrar la sesión del usuario.
 */
const logout = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader.replace(RegExp("Bearer\\s+"), "");
        const payload = validateToken(token);
        /**
         * Incluye el token utilizado para cerrar sesión en la tabla de tokens baneados para evitar su re uso.
         */        
        const tokenBetado = await prisma.token.create({
            data: {
                jti: payload.jti
            }
        });
        if (tokenBetado) {
            res.status(202).json();
        }
        const fecha = new Date();
        /**
         * Luego de retornar la respuesta, el servicio purga el listado de tokens baneados correspondientes al día anterior.
         */         
        prisma.token.deleteMany({
            where: {fecha_ban : {
                lte: (new Date(fecha.getFullYear(), fecha.getMonth() - 1, fecha.getDate() - 1, 23, 59, 59))
                    .toLocaleString('en-US', { timeZone: "America/Bogota" })
            }}
        })
    } catch(err){
        loggerMiddleware.info.error(err.message);
        return res.status(503).json();
    }
}

module.exports = {
    login,
    logout
}