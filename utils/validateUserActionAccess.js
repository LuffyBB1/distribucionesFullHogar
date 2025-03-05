const { checkSchema } = require("express-validator");


const ValidateLoginData = checkSchema({
    email: {
        notEmpty: true,
        isEmail: true,
        escape: true,
        trim: true,
        normalizeEmail: true
    },
    password: {
        notEmpty: true,
        isLength: { options: { min: 5 } },
        escape: true,
        trim: true      
    },
});

module.exports = {
    ValidateLoginData
}