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

const generatePayload = (sub) => {
    return {
        sub: sub,
        jti: crypto.randomUUID(),
        iss: tokenValidationParams.validIssuer,
        aud: tokenValidationParams.validAudience
    }    
};

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
