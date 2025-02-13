const { prisma } = require("../../prisma/database.client.prisma");
const { getAllCreditsReport, getReport, getUserCreditReport } = require('@prisma/client/sql');
const {validateModel, validateNotFoundInPrisma} = require("../../utils/validatemodels");
const dtos = require("../../prisma/schema/dto/models.dto");



const estadoFinancieroClientes = async(req, res)=> {
    try {
        const reporte = await prisma.$queryRawTyped(getAllCreditsReport());
        if (reporte == null){
            return res.status(500).json();  
        }
        console.log(reporte);
        reporte.forEach(cliente => {
            cliente.saldo_total = parseInt(cliente.saldo_total);
        });        
        return res.status(200).json(reporte);

    } catch (error) {
        console.error(error);
        return res.status(503).json({ error: "No se pudo crear el reporte" });
    }
}

const resumenCliente = async(req, res) => {
    try {
        const { id } = req.params;
        const cliente = await prisma.cliente.findFirstOrThrow({
            where: {id_cliente: parseInt(id)},
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

        if (!validateModel(req.query, dtos.reportesDto)){
            return res.status(400).json();
        }
        const { fechaInicial, fechaFinal } = req.query;        
        const reporte = await prisma.$queryRawTyped(
            getReport(
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
}