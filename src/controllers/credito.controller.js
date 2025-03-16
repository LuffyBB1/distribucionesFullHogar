const { prisma } = require("../../prisma/database.client.prisma");
const { validationResult } = require("express-validator");
const { loggerMiddleware } = require("../logging/logger");
const { validateNotFoundInPrisma, extraerDtoDeRequest } = require("../../utils/validatemodels");
const { creditoInfo } = require("../../prisma/schema/dto/models.dto");



/**
 * Función que permite modificar el monto total, frecuencia de pago o número de cuotas de un crédito
 */  
const actualizarInformacionCredito = async (req, res) => {
    try {
        /**
         * Se verifica que el resultado del middleware de validación de parámetros de la petición (i.e request.params, body o request.query) no contenga errores
         */          
        if (!validationResult(req).isEmpty() || Object.keys(req.body).length == 0) { 
            loggerMiddleware.info(`Validation errors: ${JSON.stringify(validationResult(req).array())}`);
            return res.status(400).json(); 
        } 
        const credito = await prisma.credito.findFirstOrThrow({
            where: {id_credito: req.params.id}
        });
        if (credito.estado === "PAGADO") {
            return res.status(409).json({ error: "No se puede modificar un crédito que ya ha sido pagado" });
        }
        const data = extraerDtoDeRequest(req.body, ["monto_total", "frecuencia_pago", "cuotas"]);
        /**
         * Extrae únicamente los campos permitidos para actualizar del cuerpo de la petición.
         */                  
        const creditoActualizado = await prisma.credito.update({
            where: {id_credito : req.params.id},
            data: data
        });
        if (creditoActualizado){
            return res.status(200).json({
                 message: "Crédito actualizado exitosamente"
            });
        } else{
            loggerMiddleware.error(error.message);
            return res.status(503).json("No se pudo contactar con el servicio");            
        }
        
    } catch(error) {
        if (validateNotFoundInPrisma(error)) {
            return res.status(404).json();
        }     
        loggerMiddleware.error(error.message);
        return res.status(503).json("No se pudo contactar con el servicio");                   
    }
}
/**
 * Función que permite modificar el monto total, frecuencia de pago o número de cuotas de un crédito
 */ 
const cambiarEstadoCredito = async (req, res) => {
    try {
        /**
         * Se verifica que el resultado del middleware de validación de parámetros de la petición (i.e request.params, body o request.query) no contenga errores
         */           
        if (!validationResult(req).isEmpty()) { 
            loggerMiddleware.info(`Validation errors: ${JSON.stringify(validationResult(req).array())}`);
            return res.status(400).json(); 
        }         
        const credito = await prisma.credito.findFirstOrThrow({
            where: {id_credito: req.params.id},
            select: {
                monto_total: true,
                estado: true
            }
        });
        if (credito.estado === "PAGADO") {
            return res.status(204).json({
                message: "El crédito ya está pagado"
            });            
        }
        /**
         * Se verifica si el monto abonado a la fecha es igual a la cantidad adeudada. En caso de que no, no se prosigue para modificar el estado del crédito.
         * Se usa precisión de 1 peso para validar las equivalencias.
         */      
        const totalAbonos = (await prisma.pago.aggregate({
            _sum: {
                monto_pago: true
            },
            where: {id_credito: req.params.id}
        }))._sum.monto_pago;

        if (totalAbonos === null | credito.monto_total - totalAbonos > 1){
            return res.status(409).json({
                message: "El crédito no puede ser marcado como pagado porque el total de los abonos registrados son inferiores al monto adeudado"
            });
        }
        const creditoActualizado = await prisma.credito.update({
            where: {id_credito: req.params.id},
            data: {estado: "PAGADO"}
        });
        if (creditoActualizado) {            
            return res.status(200).json({
                message: `Crédito con id: ${req.params.id} fue marcado como pagado`
            });
        }
    } catch(error) {
        if (validateNotFoundInPrisma(error)) {
            return res.status(404).json();
        }
        loggerMiddleware.error(error.message);
        return res.status(503).json("No se pudo contactar con el servicio");             
    }
}
/**
 * Función que permite crear un crédito para un usuario en específico.
 */
const crearCredito = async (req, res) => {
    try {
        /**
         * Se verifica que el resultado del middleware de validación de parámetros de la petición (i.e request.params, body o request.query) no contenga errores
         */             
        if (!validationResult(req).isEmpty()) { 
            loggerMiddleware.info(`Validation errors: ${JSON.stringify(validationResult(req).array())}`);
            return res.status(400).json();; 
        } 
        if (!(await verificarClienteExiste(parseInt(req.body.id_cliente)))){
            return res.status(404).json({error: "El cliente no existe"});
        }
        /**
         * Extrae únicamente del cuerpo de la petición unicamente los campos requeridos para la creación del crédito.
         */          
        const dataCredito = extraerDtoDeRequest(req.body, Object.keys(creditoInfo));
        const creditoCreado = await prisma.credito.create({data: dataCredito});
        if (creditoCreado) {
            return res.status(201).json({
                message: "Crédito registrado exitosamente",
                "id_credito": `${process.env.HOST}/api/creditos/${creditoCreado.id_credito}`
            });
        }        
    } catch(error) {
        if (validateNotFoundInPrisma(error)) {
            return res.status(404).json();
        }         
        loggerMiddleware.error(error.message);
        return res.status(503).json("No se pudo contactar con el servicio");   
    }
}
/**
 * Función que permite eliminar un crédito únicamente cuando no existen pagos asociados.
 */
const eliminarCredito = async (req, res) => {
    try {
        /**
         * Se verifica que el resultado del middleware de validación de parámetros de la petición (i.e request.params, body o request.query) no contenga errores
         */           
        if (!validationResult(req).isEmpty()) { 
            loggerMiddleware.info(`Validation errors: ${JSON.stringify(validationResult(req).array())}`);
            return res.status(400).json(); 
        } 
        
        const pagosAsociados = await prisma.pago.findMany({
            where: {id_credito: req.params.id}
        });
        if (pagosAsociados.length > 0){
            return res.status(409).json({
                message: "No se puede eliminar un crédito con pagos registrados"
            });
        } 
        const creditoEliminado = await prisma.credito.delete({
            where: {id_credito: req.params.id}
        });
        if (creditoEliminado){
            return res.status(200).json({
                message: `Crédito cond id: ${req.params.id} fue eliminado exitosamente`
            });
        }
    } catch(error) {
        if (validateNotFoundInPrisma(error)) {
            return res.status(404).json();
        }        
        loggerMiddleware.error(error.message);
        return res.status(503).json("No se pudo contactar con el servicio");      
    }
}

/**
 * Función que permite obtyener la información de los créditos de un cliente a partir de su documento de identidad.
 */
const obtenerCreditoPorCliente = async (req, res) => {
    try {
        /**
         * Se verifica que el resultado del middleware de validación de parámetros de la petición (i.e request.params, body o request.query) no contenga errores
         */           
        if (!validationResult(req).isEmpty()) { 
            loggerMiddleware.info(`Validation errors: ${JSON.stringify(validationResult(req).array())}`);
            return res.status(400).json(); 
        }                         
        const creditosCliente = (await prisma.cliente.findUniqueOrThrow({
            where: {id_cliente: req.query.id_cliente},
            relationLoadStrategy: 'join',
            select :{
                creditos: true
            }
        })).creditos;
        if (creditosCliente) {
            return res.status(200).json(creditosCliente);
        }

    } catch(error) {
        if (validateNotFoundInPrisma(error)) {
            return res.status(404).json("El id enviado no esta relacionado con ningun cliente");
        }       
        loggerMiddleware.error(error.message);
        return res.status(503).json("No se pudo contactar con el servicio");       
    }
}

/**
 * Función que permite encontrar un cliente por su id
 */
const verificarClienteExiste = async (cliente_id) => {
    try {
        cliente = await prisma.cliente.findFirstOrThrow({
            where: {id_cliente: parseInt(cliente_id)}
        });
        return true;
    } catch (error){
        if (validateNotFoundInPrisma(error)) {
            return false;
        }
        loggerMiddleware.error(error.message);           
        return null;
    }
}



module.exports = {
    actualizarInformacionCredito,
    cambiarEstadoCredito,
    crearCredito, 
    eliminarCredito,
    obtenerCreditoPorCliente
};