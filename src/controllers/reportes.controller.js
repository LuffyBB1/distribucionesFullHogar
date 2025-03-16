const { prisma } = require("../../prisma/database.client.prisma");
const { getAllCreditsReport, getReport, getUserCreditReport } = require('@prisma/client/sql');
const { validateNotFoundInPrisma } = require("../../utils/validatemodels");
const { loggerMiddleware } = require("../logging/logger");
const { validationResult } = require("express-validator");


/**
 * Función que permite obtener un balance del monto pendiente por pagar de todos los usuarios registrados. Soporta paginación.
 */   
const estadoFinancieroClientes = async(req, res)=> {
    try {        
        /**
         * Se verifica que el resultado del middleware de validación de parámetros de la petición (i.e request.params, body o request.query) no contenga errores
         */            
        if (!validationResult(req).isEmpty()) { 
            loggerMiddleware.info(`Validation errors: ${JSON.stringify(validationResult(req).array())}`);
            return res.status(400).json();; 
        }     
        let { page, limit } = req.query;
        if (limit === undefined) {
            limit = 50;
        }            
        const offset = page === undefined ? 0 : (parseInt(page) - 1) * parseInt(limit);

        const reporte = await prisma.$queryRawTyped(getAllCreditsReport(parseInt(limit), parseInt(offset)));        
        if (reporte == null){
            loggerMiddleware.error(error.message);
            return res.status(503).json("No se pudo contactar con el servicio");   
        }
        if (reporte.length === 0){
            loggerMiddleware.error(error.message);
            return res.status(204).json(Array());   
        }        
        /**
         * Se realiza conversión a entero del monto adeudado para conservar el formato json de la respuesta.
         */            
        reporte.forEach(cliente => {
            cliente.saldo_total = parseInt(cliente.saldo_total);
        });        
        return res.status(200).json(reporte);

    } catch (error) {
        loggerMiddleware.error(error.message);
        return res.status(503).json("No se pudo contactar con el servicio");   
    }
}

/**
 * Función que permite obtener el listado de créditos y pagos asociados para un cliente en específico. Soporta paginación.
 */   
const historialCliente = async (req, res) => {
    try {
        /**
         * Se verifica que el resultado del middleware de validación de parámetros de la petición (i.e request.params, body o request.query) no contenga errores
         */          
        if (!validationResult(req).isEmpty()) { 
            loggerMiddleware.info(`Validation errors: ${JSON.stringify(validationResult(req).array())}`);
            return res.status(400).json(); 
        } 
        const { id } = req.params;
        let { page, limit } = req.query;
        if (limit === undefined) {
            limit = 50;
        }          
        const offset = page === undefined ? 0 : (parseInt(page) - 1) * parseInt(limit);  
        let filter;
        /**
         * Se verifica que el usuario que esta accediendo al endpoint solo pueda revisar su estado de crédito. En el caso de que sea admin del sistema, podrá verificar
         * cualquier estado de crédito.
         */          
        if (req.isAdmin) {
            filter = {
                id_cliente: id
            };
        } else {
            filter = {
                id_cliente: id,
                id_usuario: req.userId
            };
        }
        const cliente = await prisma.cliente.findFirstOrThrow({
            where: filter,
            select: {
                id_cliente: true,
                nombre: true,
                creditos: {
                    skip: offset,
                    take: parseInt(limit),
                    include: {
                        pagos: {                        
                        orderBy: {
                            fecha_pago: "desc"
                        }}
                    },                    
                }
            }
        });
        if (cliente == null) {
            return res.status(403).json();    
        }
        return res.status(200).json(cliente);

    } 
    catch (error) {
        console.error(error.message);
        if (validateNotFoundInPrisma(error)) {
            return res.status(404).json("El cliente no existe");
        }         
        loggerMiddleware.error(error.message);
        return res.status(503).json("No se pudo contactar con el servicio");   
    }   
}
/**
 * Función que permite obtener un balance de cuanto del total del monto adeudado y del total pagado por un cliente
 */  
const resumenCliente = async(req, res) => {
    try {
        /**
         * Se verifica que el resultado del middleware de validación de parámetros de la petición (i.e request.params, body o request.query) no contenga errores
         */          
        if (!validationResult(req).isEmpty()) { 
            loggerMiddleware.info(`Validation errors: ${JSON.stringify(validationResult(req).array())}`);
            return res.status(400).json(); 
        } 
        if (req.userId !== req.params.id && !req.isAdmin) { return res.status(403).json(); }
        /**
         * Se verifica que el usuario que esta accediendo al endpoint solo pueda revisar su estado de crédito. En el caso de que sea admin del sistema, podrá verificar
         * cualquier estado de crédito.
         */  
        let filter;
        if (req.isAdmin) {
            filter = {
                id_cliente: req.params.id
            };
        } else {
            filter = {
                id_cliente: req.params.id,
                id_usuario: req.userId
            };
        }        
        const cliente = await prisma.cliente.findFirstOrThrow({
            where: filter,
            select: {
                id_cliente: true,
                documentoIdentidad: true
            }
        });
        
        const estadoCreditos = (await prisma.$queryRawTyped(
            getUserCreditReport(req.params.id)));
        
        estadoCreditos.forEach(credito => {
            credito.monto_total = parseInt(credito.monto_total);
            credito.total_pagos = parseInt(credito.total_pagos);
        });
        if (estadoCreditos == null) {
            return res.status(500).json();    
        }
        return res.status(200).json({
            cliente_id: `${process.env.HOST}/api/clientes/${cliente.documentoIdentidad}`,
            estado: estadoCreditos
        });        
    } catch (error) {
        if (validateNotFoundInPrisma(error)) {
            return res.status(404).json();
        }         
        loggerMiddleware.error(error.message);
        return res.status(503).json("No se pudo contactar con el servicio");   
    }    
}

/**
 * Función que permite obtener un estado de financiero del monto total que se ha financiado a crédito y el monto total que ha sido pagado por todos los clientes.
 * Este reporte se genera entre dos fechas que recibe mediante req.query
 */   
const resumenFinancieroPeriodico = async(req, res)=> {
    try {
        /**
         * Se verifica que el resultado del middleware de validación de parámetros de la petición (i.e request.params, body o request.query) no contenga errores
         */           
        if (!validationResult(req).isEmpty()) { 
            loggerMiddleware.info(`Validation errors: ${JSON.stringify(validationResult(req).array())}`);
            return res.status(400).json();; 
        } 
        const { fechaInicial, fechaFinal } = req.query;        
        const reporte = await prisma.$queryRawTyped(getReport(
                new Date(fechaInicial), new Date(fechaFinal)));
        
        if (reporte == null) {
            loggerMiddleware.error("No se encontró un reporte de acuerdo con los parámetros de búsqueda");
            return res.status(404).json();        
        }
        const {total_creditos, total_pagos } = reporte[0];
        return res.status(200).json({
            periodo: `${fechaInicial} - ${fechaFinal}`,
            total_creditos: parseInt(total_creditos),
            total_pagos: parseInt(total_pagos)
        });
    } catch(error) {
        loggerMiddleware.error(error.message);
        return res.status(503).json("No se pudo contactar con el servicio");   
    }
}

module.exports = {
    estadoFinancieroClientes,
    resumenCliente,
    resumenFinancieroPeriodico,
    historialCliente
}