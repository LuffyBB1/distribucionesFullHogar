const {checkSchema} = require("express-validator");

const clienteInfo  = {
    documentoIdentidad: {
        exists: true, 
        notEmpty: true,
        isString: true,
        isLength: { options: { min: 7 } },
        escape: true,
        trim: true
    },
    nombre: {
        exists: true,
        notEmpty: true,
        isString: true,
        isLength: { options: { min: 7 } },
        escape: true,
        escape: true,
        trim: true        
    },
    telefono:{
        exists: true,
        notEmpty: true,
        isString: true,
        isLength: { options: { min: 10 } },
        escape: true,
        escape: true,
        trim: true        
    },
    direccion: {
        exists: true,
        notEmpty: true,
        isString: true,
        isLength: { options: { min: 8 } },
        escape: true,
        trim: true      
    },
    email: {
        exists: true,
        notEmpty: true,
        isEmail: true,
        escape: true,
        trim: true,
        normalizeEmail: true
    }
};

const usuarioInfo = {
    email: {
        exists: true,
        notEmpty: true,
        isEmail: true,
        escape: true,
        trim: true,
        normalizeEmail: true
    },
    password: {
        exists: true,
        notEmpty: true,
        isLength: { options: { min: 8 } },
        escape: true,
        trim: true      
    },
    documentoIdentidad: { 
        exists: true,
        notEmpty: true,
        isString: true,
        isLength: { options: { min: 8 } },
        escape: true,
        trim: true
    },
    roles: { notEmpty: true },
};


const creditoInfo = {
    id_cliente: {
        exists: true,
        notEmpty: true,
        isInt: true,
        escape: true,
        trim: true,
        toInt: true  
    },
    
    monto_total: {
        exists: true,
        notEmpty: true,
        isInt: { options: { min : 1} },
        escape: true,
        trim: true,
        toInt: true   
        
    },
    cuotas: {
        exists: true,
        notEmpty: true,
        isInt: { options: { min : 1} },
        escape: true,
        trim: true,
        toInt: true   
    },
    frecuencia_pago:{
        exists: true,
        notEmpty: true,
        isString: { options: {
            isIn : ["MENSUAL", "QUINCENAL"]
        },
        escape: true,
        trim: true   
        }
    }
};

const pagoInfo = {
    id_credito : {
        exists: true,
        notEmpty: true,
        isInt: true,
        escape: true,
        trim: true,
        toInt: true          
    },
    id_pago: {
        exists: true,
        notEmpty: true,
        isInt: true,  
        escape: true,
        trim: true,
        toInt: true   
    },
    monto_pago: {
        exists: true,
        notEmpty: true,
        isInt : { options: { min: 1} },
        escape: true,
        trim: true,
        toInt: true   
    },
    fecha_pago: {
        exists: true,
        notEmpty: true,
        isDate: true,
        escape: true,
        trim: true,    
    }
    
}

const reporteInfo = {
    fechaInicial: { 
        exists: true,
        notEmpty: true,
        isString: true,
        escape: true,
        trim: true   
    },
    fechaFinal: { 
        exists: true,
        notEmpty: true,
        isString: true,
        escape: true,
        trim: true   
    }    
}


function crearCheckSchema (info, ...camposNoDeseados) {
    const camposDeseados = Object();
    
    Object.keys(info).forEach(key => {
        if (!camposNoDeseados.includes(key)){
            camposDeseados[key] = info[key]
        }
    });
    return checkSchema({...camposDeseados});
}

function makeFieldsOptional(info, ...camposSeleccionados) {
    if (camposSeleccionados.length > 0) {
        camposSeleccionados.forEach(field => {
            delete info[field].exists
            info[field] = Object.assign(info[field], {optional: { options: { nullable: true }}})
        });        
    }
    return info;
}

const crearclienteCompletoDto = crearCheckSchema(clienteInfo);

const crearClienteDto = crearCheckSchema(clienteInfo, "email");

const actualizarClienteDto = crearCheckSchema(makeFieldsOptional(clienteInfo, "nombre", "direccion", "telefono"), "email", "documentoIdentidad")

const crearCreditoDto = crearCheckSchema(creditoInfo);

const actualizarCreditoDto = crearCheckSchema(makeFieldsOptional(creditoInfo, "monto_total", "cuotas", "frecuencia_pago"), "id_cliente");

const crearPagoDto = crearCheckSchema(pagoInfo, "id_pago", "fecha_pago");

const actualizarPagoDto = crearCheckSchema(makeFieldsOptional(pagoInfo, "monto_pago", "fecha_pago"), "id_pago")

const crearReportesDto = crearCheckSchema(reporteInfo);

const crearUsuarioDto = crearCheckSchema(usuarioInfo);

const actualizarUsuarioDto = crearCheckSchema(makeFieldsOptional(usuarioInfo, "email", "password"), "roles", "documentoIdentidad");


module.exports = {
    actualizarClienteDto,
    actualizarCreditoDto,
    actualizarUsuarioDto,
    actualizarPagoDto,
    crearCreditoDto,
    crearclienteCompletoDto,
    crearClienteDto,
    crearPagoDto,
    crearReportesDto,
    crearUsuarioDto,
    creditoInfo
};


// (() => {    
//     const {id_credito, ...pago} = pagoInfo; 
//     Object.Keys(pago).forEach(field => {
//         pago[field] = Object.assing(pago[field], {optional: { options: { nullable: true }}})
//     });
//     return checkSchema({
//         ...pago
//     });
// })();