const { Prisma } = require("@prisma/client");

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

const validateNotFoundInPrisma = (error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError 
      && error.code === 'P2025') {
        return true;
    }else {
      return false;
    }
}

const validateUniqueFieldViolation = (error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError 
      && error.code === 'P2002') {
        return true;
    }else {
      return false;
    }
}

const extraerDtoDeRequest = (body, modelDto) => {
    const data = Object();
    modelDto.forEach((field)=>{
        if (body[field] != null) {
            data[field] = body[field];
        }
    });
    return data;
}

module.exports = {
    validateModel,
    validateObjectContainsField,
    validateNotFoundInPrisma,
    extraerDtoDeRequest,
    validateUniqueFieldViolation
};