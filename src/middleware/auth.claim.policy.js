const { prisma } = require("../../prisma/database.client.prisma")
const { loggerMiddleware } = require("../logging/logger");


/**
 * Construye un objeto de claims que será utilizado para validar una política de autorización. 
 * En esta versión solo se incluyen los claims de es autenticado y los roles que el usuario debe tener para ser autorizado.
 * @param {string | Array} roleValue - nombre o lista de nombres de roles.
 * @returns {Object} Retorna un objeto que contiene los claims para validar autorización.
 */

const roleRequirements = async (roleValue) => {
    const roles = Array();
    const rolesToFind = Array.isArray(roleValue) ? roleValue : [roleValue];
    for(const roleName of rolesToFind) {   
        roles.push(            
            (await (prisma.role.findFirstOrThrow({
                where : {Name: roleName},
                select:{
                    id: true
                }})
            )).id
        );
    }
    if (!roles.every(Boolean)){
        throw new Error("Roles not found in database");
    }
    return {
        isAuthenticated : true,
        roles : roles
    };
}

/**
 * Compara que un objeto de claims tiene los atributos definidos para la política de autorización
 * En esta versión solo se incluyen los claims de es autenticado y los roles que el usuario debe tener para ser autorizado.
 * @param {Object} claimsObject - objeto con claims del usuario autenticado
 * @param {Object} thrutyValuesObject - objeto con claims que deben verificarse. Se define en la política de autorización con la función roleRequirements
 * @returns {Boolean} Retorna un objeto que contiene los claims para validar autorización.
 */

const claimsValidaton = (claimsObject, thrutyValuesObject) =>{
    try {
        const validation = Object.keys(thrutyValuesObject).map((claim) => {
            
            const isClaimArray = Array.isArray(claimsObject[claim]);
            const isThruthyValueArray = Array.isArray(thrutyValuesObject[claim]);
            
            if (isThruthyValueArray && !isClaimArray) {
                return false;
            }            
            
            if (isClaimArray && isThruthyValueArray) {
                return thrutyValuesObject[claim].every(thruty => 
                    claimsObject[claim].includes(thruty)
                );
 
            }
            if (isClaimArray && !isThruthyValueArray) {
                return claimsObject[claim].includes(thrutyValuesObject[claim]);
            }

            if (!(isClaimArray && isThruthyValueArray)) {
                return thrutyValuesObject[claim] === claimsObject[claim];
            }

        });
        return validation.every(Boolean);
    } catch (error) {
        return null;
    }
}

/**
 * Compara que un objeto de claims tiene los atributos definidos para la política de autorización
 * En esta versión solo se incluyen los claims de es autenticado y los roles que el usuario debe tener para ser autorizado.
 * @param {Object} claimsObject - objeto con claims del usuario autenticado
 * @param {string | Array} roleValue - contiene el nombre de los roles que el usuario debe tener para poder ser autorizado
 * @returns {Boolean} Retorna un objeto que contiene los claims para validar autorización.
 */


const validateRoleRequirements = async (claimsObject, roleValue) => {
        const requirements = await roleRequirements(roleValue);
        return claimsValidaton(claimsObject, requirements);
}


/**
 * Construye una función que representa la politica de autorización basada en roles.
 * @param {string | Array} roleValue - contiene el nombre de los roles que el usuario debe tener para poder ser autorizado
 * @returns {Function} función middleware que representa la politica de autorización creada para el rol ingresado.
 */


const rolePolicyMiddlewareFactory = (roleValue) => {
    
    return async (req, res, next) => {
        try {
            loggerMiddleware.info(`UserId ${req.userId} - claim policy is going to be challenged`);
            const user = await prisma.usuario.findFirstOrThrow({
                where : {id_user : req.userId},
                select: {
                    emailConfirmed: true,
                    roles: true
                }
            });

            const roles = await prisma.role.findMany();
            
            user['isAuthenticated'] = req.isAuthenticated;
            const validation = await validateRoleRequirements(user, roleValue);
            if (validation == null || validation === false){
                loggerMiddleware.info(`user: ${user.id} doesn't have right permissions to access.`)
                return res.status(403).json();
            }
            user.roles = user.roles.map(urole => 
                roles.find(role => role.id === urole)
            );
            req['claims'] = user;
            const adminRole = user.roles.find(role => role.Name === "Admin");
            if (adminRole != null) {
                req.isAdmin = true;
            } else{
                req.isAdmin = false;
            }
            loggerMiddleware.info(`UserId ${req.userId} - claim policy challenged successfully`);
            next();
        } catch(error){
            loggerMiddleware.error(`User authorization failed: ${error}`);
            return res.status(403).json();
        }        
    }
}

module.exports = {
    policyMiddlewareFactory: rolePolicyMiddlewareFactory
}

