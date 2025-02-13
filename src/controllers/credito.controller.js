const { prisma } = require("../../prisma/database.client.prisma");

const dtos = require("../../prisma/schema/dto/models.dto");
const { validateModel, 
        validateObjectContainsField, 
        validateNotFoundInPrisma,
        extraerDtoDeRequest } = require("../../utils/validatemodels");


const actualizarInformacionCredito = async (req, res) => {
    try {
        const { id } = req.params;
        camposAtualizados = validateObjectContainsField(req.body, dtos.actualizarCreditoDto);
        if (camposAtualizados.length === 0){
            return res.status(400).json({ error: "No se pudo editar el crédito" });
        }
        console.log(camposAtualizados, id);
        const credito = await prisma.credito.findFirstOrThrow({
            where: {id_credito: parseInt(id)}
        });
        console.log(credito);
        if (credito.estado === "PAGADO") {
            return res.status(400).json({ error: "No se puede modificar un crédito que ya ha sido pagado" });
        }
        const data = extraerDtoDeRequest(req.body, camposAtualizados);
        console.log(data);
        const creditoActualizado = await prisma.credito.update({
            where: {id_credito : parseInt(id)},
            data: data
        });
        if (creditoActualizado){
            return res.status(200).json({
                 message: "Crédito actualizado exitosamente"
            });
        }

    } catch(error) {
        if (validateNotFoundInPrisma(error)) {
            return res.status(404).json();
        }           
    }
}

const cambiarEstadoCredito = async (req, res) => {
    try {
        const { id } = req.params;

        const credito = await prisma.credito.findFirstOrThrow({
            where: {id_credito: parseInt(id)},
            select: {
                monto_total: true,
                estado: true
            }
        });
        if (credito.estado === "PAGADO") {
            return res.status(400).json({
                message: "El crédito ya está pagado"
            });            
        }

        const totalAbonos = (await prisma.pago.aggregate({
            _sum: {
                monto_pago: true
            },
            where: {id_credito: parseInt(id)}
        }))._sum.monto_pago;

        if (totalAbonos === null | credito.monto_total - totalAbonos > 0.01){
            return res.status(409).json({
                message: "El crédito no puede ser marcado como pagado porque el total de los abonos registrados son inferiores al monto adeudado"
            });
        }
        const creditoActualizado = await prisma.credito.update({
            where: {id_credito: parseInt(id)},
            data: {estado: "PAGADO"}
        });
        if (creditoActualizado) {            
            return res.status(200).json({
                message: "Crédito marcado como pagado"
            });
        }
    } catch(error) {
        if (validateNotFoundInPrisma(error)) {
            return res.status(404).json();
        }           
    }
}

const crearCredito = async (req, res) => {
    try {
        if (!validateModel(req.body, dtos.creditoDto)) {
            return res.status(400).json();
        }
        if (!(await verificarClienteExiste(parseInt(req.body.id_cliente)))){
            return res.status(400).json({error: "El cliente no existe"});
        }
        const dataCredito = extraerDtoDeRequest(req.body, dtos.creditoDto);
        const creditoCreado = await prisma.credito.create({data: dataCredito});
        if (creditoCreado) {
            return res.status(201).json({
                message: "Crédito registrado exitosamente",
                "id_credito": `${process.env.HOST}/api/credito/${creditoCreado.id_credito}`
            });
        }        
    } catch(error) {
        if (validateNotFoundInPrisma(error)) {
            return res.status(404).json();
        }         
        console.error(error)  ;
        return res.status(503).json({ error: "No se pudo crear el crédito" });
    }
}

const eliminarCredito = async (req, res) => {
    try {
        const { id } = req.params;
        const pagosAsociados = await prisma.pago.findMany({
            where: {id_credito: parseInt(id)}
        });
        if (pagosAsociados.length > 0){
            return res.status(409).json({
                message: "No se puede eliminar un crédito con pagos registrados"
            });
        } 
        const creditoEliminado = await prisma.credito.delete({
            where: {id_credito: parseInt(id)}
        });
        if (creditoEliminado){
            return res.status(200).json({
                message: "Crédito eliminado exitosamente"
            });
        }
    } catch(error) {
        if (validateNotFoundInPrisma(error)) {
            return res.status(404).json();
        }           
    }
}
const obtenerCreditoPorCliente = async (req, res) => {
    try {
        const clienteId = req.query.id_cliente;
        
        const clienteExiste = await verificarClienteExiste(clienteId);
        if (!clienteExiste || clienteExiste === null) {
            return res.status(400).json({error: "Cliente no encontrado"});
        }
        
        const creditosCliente = (await prisma.cliente.findFirst({
            where: {id_cliente: parseInt(clienteId)},
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
            return res.status(404).json();
        }           
    }
}


const verificarClienteExiste = async (cliente_id) => {
    try {
    
        cliente = await prisma.cliente.findFirst({
            where: {id_cliente: parseInt(cliente_id)}
        });
        if (cliente) {
            return true;
        }
        
    } catch (error){
        console.error(error);
        if (validateNotFoundInPrisma(error)) {
            return false;
        }           
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