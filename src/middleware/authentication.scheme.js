const { requiredTokenPayloadClaims, validateToken } = require("./auth.jwt.handler");
const { prisma } = require("../../prisma/database.client.prisma");
const { loggerMiddleware } = require("../logging/logger");


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
        var tokenClaims = Object.keys(payload);
        const hasRequiredTokens = (requiredTokenPayloadClaims.map(claim => tokenClaims.includes(claim))).every(Boolean);
        if (foundBannedToken || !hasRequiredTokens) { return res.status(401).json("Unauthorized"); }
        req.userId = payload.sub;
        req.isAuthenticated = true
        req.authToken = payload.jti
        loggerMiddleware.info(`UserId ${payload.sub} authentication successfully`);
        next();
    } catch(err){
        loggerMiddleware.error(`User authentication failed: ${err}`);
        return res.status(401).json("Unauthorized"); 
    }

}

module.exports = {JwtSchemeAuthorization};