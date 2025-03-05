const {checkSchema} = require("express-validator");

const validarParamsIntId  = checkSchema({
    id: {
      exists: true,
      notEmpty: true,
      isInt: true,
      escape: true,
      trim: true,
      toInt: true,
    }
});

const validarQueryIntId  = checkSchema({
    id_cliente: {
      exists: true,
      notEmpty: true,
      isInt: true,
      escape: true,
      trim: true,
      toInt: true,
    }
});

const validarParamsIdDI  = checkSchema({
  id: {
    exists: true,
    notEmpty: true,
    isString: true,
    isLength: { options: { min: 8 } },
    escape: true,
    trim: true,
  }
});

const validarParamsUuidId  = checkSchema({
    id: {
      exists: true,
      notEmpty: true,
      isUUID: true,
      escape: true,
      trim: true,

    }
});

const validarPaginacion  = checkSchema({
    limit: {
      exists: true,
      notEmpty: true,
      isInt: true,
      escape: true,
      trim: true,
      optional: true
    },
    page: {
        exists: true,
        notEmpty: true,
        isInt: true,
        escape: true,
        trim: true,
        optional: true
      },
});

module.exports = {
    validarParamsIntId,
    validarParamsUuidId,
    validarPaginacion,
    validarQueryIntId,
    validarParamsIdDI
}