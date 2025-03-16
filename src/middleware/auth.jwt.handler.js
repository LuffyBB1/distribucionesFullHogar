const jwt = require('jsonwebtoken');

const tokenValidationParams = {
    validIssuer : process.env.ISSUER,
    validAudience : process.env.AUDIENCE,
    validateAudience : Boolean(process.env.VALIDATE_AUDIENCE),
    validateIssuer : Boolean(process.env.VALIDATE_ISSUER),
    signingKey : btoa(process.env.JWT_KEY),
    expiryTime : process.env.JWT_EXPIRETIME
};

const requiredTokenPayloadClaims = ["sub", "jti", "iss", "aud", "exp"];

/**
 * Genera el payload del JWT Token utilizado por el sistema de autenticación
 * @param {string} sub - representa el id del usuario
 * @returns {Object} Payload del token JWT.
 */

const generatePayload = (sub) => {
    return {
        sub: sub,
        jti: crypto.randomUUID(),
        iss: tokenValidationParams.validIssuer,
        aud: tokenValidationParams.validAudience
    }    
};

/**
 * Genera y Firma el token JWT para el sistema de autenticación
 * @param {Object} tokenPayload - representa el cuerpo del token JWT
 * @returns {string} token JWT firmado.
 */

const signToken = (tokenPayload) => {
    return jwt.sign(
        tokenPayload,
        tokenValidationParams.signingKey,
        { 
            algorithm: 'HS256',
            expiresIn: 60 * tokenValidationParams.expiryTime
        }
    )
};

/**
 * Valida que el token haya sido firmado por el valid issuer definido en la configuración del sistema
 * @param {string} token - token JWT
 * @returns {Object} Payload del token JWT.
 */

const validateToken = (token) => {
    const options = Object();
    if (tokenValidationParams.validateAudience){
        options['aud'] = tokenValidationParams.validAudience
    }
    if (tokenValidationParams.validateIssuer){
        options['aud'] = tokenValidationParams.validIssuer
    }    
    options['algorithm'] = 'HS256'
    try {
        return jwt.verify(token, tokenValidationParams.signingKey, options);

    } catch(err){
        return null;
    }
}

module.exports = {
    tokenValidationParams,
    requiredTokenPayloadClaims,
    generatePayload,
    signToken,
    validateToken
}
