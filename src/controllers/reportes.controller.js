const { prisma } = require("../../prisma/database.client.prisma");
const { getAllCreditsReport, getReport, getUserCreditReport } = require('@prisma/client/sql');
const {validateNotFoundInPrisma} = require("../../utils/validatemodels");
const { validationResult } = require("express-validator");



const estadoFinancieroClientes = async(req, res)=> {
    try {
        
        let { page, limit } = req.query;
        if (limit === undefined) {
            limit = 50;
        }            
        const offset = page === undefined ? 0 : (parseInt(page) - 1) * parseInt(limit);

        const reporte = await prisma.$queryRawTyped(getAllCreditsReport(parseInt(limit), parseInt(offset)));        
        if (reporte == null){
            return res.status(500).json();  
        }
        reporte.forEach(cliente => {
            cliente.saldo_total = parseInt(cliente.saldo_total);
        });        
        return res.status(200).json(reporte);

    } catch (error) {
        console.error(error);
        return res.status(503).json({ error: "No se pudo crear el reporte" });
    }
}

const historialCliente = async (req, res) => {
    try {
        if (!validationResult(req).isEmpty()) { return res.status(400).json(); } 
        const { id } = req.params;
        let { page, limit } = req.query;
        if (limit === undefined) {
            limit = 50;
        }          
        const offset = page === undefined ? 0 : (parseInt(page) - 1) * parseInt(limit);  
        let filter;
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
        console.error(error);
        if (validateNotFoundInPrisma(error)) {
            return res.status(404).json("El cliente no existe");
        }         
        return res.status(503).json({ error: "No se pudo crear el reporte" });
    }   
}

const resumenCliente = async(req, res) => {
    try {
        if (!validationResult(req).isEmpty()) { return res.status(400).json(); } 
        if (req.userId !== req.params.id && !req.isAdmin) { return res.status(403).json(); }
        const { id } = req.params;
        let filter;
        if (req.isAdmin) {
            filter = {
                id_cliente: parseInt(id)
            };
        } else {
            filter = {
                id_cliente: parseInt(id),
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
            getUserCreditReport(parseInt(id))));
        
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
        console.error(error);
        if (validateNotFoundInPrisma(error)) {
            return res.status(404).json();
        }         
        return res.status(503).json({ error: "No se pudo crear el reporte" });
    }    
}

const resumenFinancieroPeriodico = async(req, res)=> {
    try {
        if (!validationResult(req).isEmpty()) { return res.status(400).json(validationResult(req)); } 
        const { fechaInicial, fechaFinal } = req.query;        
        const reporte = await prisma.$queryRawTyped(getReport(
                new Date(fechaInicial), new Date(fechaFinal)));
        
        if (reporte == null) {
            return res.status(500).json();        
        }
        const {total_creditos, total_pagos } = reporte[0];
        return res.status(200).json({
            periodo: `${fechaInicial} - ${fechaFinal}`,
            total_creditos: parseInt(total_creditos),
            total_pagos: parseInt(total_pagos)
        });
    } catch(error) {
        console.error(error);
        return res.status(503).json({ error: "No se pudo crear el reporte" });
    }
}



module.exports = {
    estadoFinancieroClientes,
    resumenCliente,
    resumenFinancieroPeriodico,
    historialCliente
}