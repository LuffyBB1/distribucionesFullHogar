
const validateModel = (modelObject, modelKeys) => {
    try {
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

module.exports = {
    validateModel,
    validateObjectContainsField
};