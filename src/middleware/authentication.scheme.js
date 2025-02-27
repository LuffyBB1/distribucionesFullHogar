const { tokenValidationParams, requiredTokenPayloadClaims, generatePayload, signToken, validateToken } = require("./auth.jwt.handler");
const { prisma } = require("../../prisma/database.client.prisma");

const JwtSchemeAuthorization  = async(req, res, next) => {
    try{
        const authHeader = req.headers['authorization'];
        if (authHeader == null) { return res.status(401).json("Unauthorized"); }
        const token = authHeader.replace(RegExp("Bearer\\s+"), "");
        const payload = validateToken(token);
        if (payload == null) { return res.status(401).json("Unauthorized"); }
        const foundBannedToken = await prisma.token.findFirst({
            where: {jti : payload.jti}
        });
        console.log(foundBannedToken, payload.jti);
        tokenClaims = Object.keys(payload);
        const hasRequiredTokens = (requiredTokenPayloadClaims.map(claim => tokenClaims.includes(claim))).every(Boolean);
        if (foundBannedToken || !hasRequiredTokens) { return res.status(401).json("Unauthorized"); }
        req.userId = payload.sub;
        req.isAuthenticated = true
        req.authToken = payload.jti
        next();
    } catch(err){
        console.error(err);
        return res.status(401).json("Unauthorized"); 
    }

}

module.exports = {JwtSchemeAuthorization};