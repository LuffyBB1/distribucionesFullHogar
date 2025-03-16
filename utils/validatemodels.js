const { Prisma } = require("@prisma/client");

/**
 * Verifica si un objeto contiene exclusivamente un grupo de keys.
 * @param {Object} modelObject - objeto al que se quiere validar la existencia de keys.
 * @param {Array} modelKeys - grupo de keys que deben contener los objetos para validar si corresponden a un respectivo modelo.
 * @returns {boolean} Booleano que representa la validación de todos los keys.
 */


const validateModel = (modelObject, modelKeys) => {
    try {
        console.log(modelObject, modelKeys);
        const validation = modelKeys.map(
            (key) => Object.keys(modelObject).includes(key) == true ? true : false );
        if (validation.every(Boolean)){
            return true;
        } else {
            return false
        }        
    } catch(error) {
        return null;
        
    }
}
/**
 * Reduce un objeto para que solo contenga un grupo de keys y sus respectivos valores.
 * @param {Object} modelObject - objeto en el que se quiere extraer los pares key-item de acuerdo con un grupo de keys.
 * @param {Array} modelKeys - grupo de keys que se desean extraer.
 * @returns {Object} Objeto que contiene únicamente los keys definidos.
 */
const validateObjectContainsField = (modelObject, modelKeys) => {
    try {
        const fields = Object.keys(modelObject).filter(
            (key) => modelKeys.includes(key) === true
        );

        return fields;
    }catch(error) {
        return null;
    }
}

/**
 * Verifica si el error retornado por una operación de PRISMA corresponde a que no encontró la entidad especificada.
 * @param {error} error - Error retornado por PRISMA.
 * @returns {boolean} Booleano que representa si el error corresponde a la no existencia de la entidad 
 */

const validateNotFoundInPrisma = (error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError 
      && error.code === 'P2025') {
        return true;
    }else {
      return false;
    }
}


/**
 * Verifica si el error retornado por una operación de PRISMA corresponde a que se esta violando un valor a un campo definido como 
 * UNIQUE en una tabla SQL.
 * @param {error} error - Error retornado por PRISMA.
 * @returns {boolean} Booleano que representa si el error corresponde a que se pasó un valor no único a la tabla SQL
 */
const validateUniqueFieldViolation = (error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError 
      && error.code === 'P2002') {
        return true;
    }else {
      return false;
    }
}

module.exports = {
    validateModel,
    validateObjectContainsField,
    validateNotFoundInPrisma,
    validateUniqueFieldViolation
};