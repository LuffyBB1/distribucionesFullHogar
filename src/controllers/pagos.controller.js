const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { validationResult } = require("express-validator");
const { validateNotFoundInPrisma } = require("../../utils/validatemodels");
const { loggerMiddleware } = require("../logging/logger");


const registrarPago = async (req, res) => {
  
  try {
    if (!validationResult(req).isEmpty() || Object.keys(req.body).length == 0) { 
      loggerMiddleware.info(`Validation errors: ${JSON.stringify(validationResult(req).array())}`);
      return res.status(400).json();; 
    }     
    const { id_credito, monto_pago } = req.body;
    // Verificar que el crédito existe y está pendiente
    const credito = await prisma.credito.findUniqueOrThrow({
      where: { id_credito },
    });

    if (!credito) {
      return res.status(404).json({ error: "Crédito no encontrado" });
    }

    if (credito.estado === "PAGADO") {
      return res.status(400).json({ error: "El crédito ya está pagado" });
    }

    const pagosRealizados = await prisma.pago.aggregate({
      where: { id_credito },
      _sum: { monto_pago: true },
    });

    const totalPagado = pagosRealizados._sum.monto_pago || 0;

    if (credito.monto_total - totalPagado - monto_pago < 0) {
      return res.status(409).json("Al incluir el nuevo pago, la suma de los montos pagados excede el monto del crédito");
    }
    const nuevoPago = await prisma.$transaction(async (tx) => {
      const pago = await tx.pago.create({
        data: { id_credito, monto_pago },
      });

      if (Math.abs(totalPagado + pago.monto_pago - credito.monto_total) < 1) {
        await tx.credito.update({
          where: { id_credito },
          data: { estado: "PAGADO" },
        });
      }
      return pago;
    });
    return res.status(201).json(nuevoPago);
  } catch (error) {
    loggerMiddleware.error(error.message);
    return res.status(503).json("No se pudo contactar con el servicio");   
  }
};

/**
 * Obtener pagos de un cliente
 */
const obtenerPagosCliente = async (req, res) => {
  try {
    if (!validationResult(req).isEmpty()) { 
      loggerMiddleware.info(`Validation errors: ${JSON.stringify(validationResult(req).array())}`);
      return res.status(400).json(); 
    } 
    const cliente = await prisma.cliente.findUniqueOrThrow({
      where: { id_cliente: parseInt(req.params.id) },
      include: { creditos: { include: { pagos: true } } },
    });

    return res.status(200).json(cliente.creditos);
  } catch (error) {
    if (validateNotFoundInPrisma(error)) {
      return res.status(404).json();
    }         
    loggerMiddleware.error(error.message);
    return res.status(503).json("No se pudo contactar con el servicio");   
  }
};

/**
 * Modificar un pago existente
 */
const modificarPago = async (req, res) => {
  if (!validationResult(req).isEmpty() || Object.keys(req.body).length == 0) { 
    loggerMiddleware.info(`Validation errors: ${JSON.stringify(validationResult(req).array())}`);
    return res.status(400).json(); 
  } 
  const { id } = req.params;
  const { id_credito, monto_pago } = req.body;
  try {
    const pagoExistente = await prisma.pago.findUniqueOrThrow({
      where: { id_pago: parseInt(id) },
    });

    const credito = await prisma.credito.findUniqueOrThrow({
      where: { id_credito },
    });

    const pagosRealizados = await prisma.pago.aggregate({
      where: { id_credito },
      _sum: { monto_pago: true },
    });    

    const totalPagado = pagosRealizados._sum.monto_pago || 0;  

    const pagoActualizado = prisma.$transaction(async (tx) =>{
      if ((credito.monto_total - totalPagado - (monto_pago - pagoExistente.monto_pago )) >= 1) {

        await tx.credito.update({
          where: { id_credito: credito.id_credito },
          data: { estado: "PENDIENTE" },
        });
      } else {
        await tx.credito.update({
          where: { id_credito: credito.id_credito },
          data: { estado: "PAGADO" },
        });
      }
      return await prisma.pago.update({
        where: { id_pago: parseInt(id) },
        data: { monto_pago },
      });
    });

    if (pagoActualizado == null) {
      return res.status(503).json("Servicio no disponible");
    }

    return res.status(200).json(pagoActualizado);

  } catch (error) {
    if (validateNotFoundInPrisma(error)) {
      return res.status(404).json();
    }       
    loggerMiddleware.error(error.message);
    return res.status(503).json("No se pudo contactar con el servicio");   
  }
};
const eliminarPago = async (req, res)=> {
  try{
    if (!validationResult(req).isEmpty()) { 
      loggerMiddleware.info(`Validation errors: ${JSON.stringify(validationResult(req).array())}`);
      return res.status(400).json(); 
    } 
    const milisegundosAHoras = 1000 * 60 * 60;
    const tiempoParaAjuste = 7 * 24;
    const pago = await prisma.pago.findUniqueOrThrow({
      where: {id_pago: parseInt(req.params.id)}
    });
    const credito = await prisma.credito.findUniqueOrThrow({
      where: {id_credito: pago.id_credito}
    });
    if (credito.estado === "PAGADO") {
      return res.status(409).json("No se puede eliminar el pago de un crédito pagado");
    }
    const horasDesdePago = (new Date() - pago.fecha_pago)/milisegundosAHoras;
    if (horasDesdePago > tiempoParaAjuste) { return res.status(409).json("No se puede eliminar un pago realizado hace más de 7 días")}
    const pagoEliminado = await prisma.pago.delete({
      where: {id_pago: parseInt(req.params.id)}
    });
    if (pagoEliminado == null) { return res.status(503).json();}
    return res.status(200).json(`El pago con id ${pagoEliminado.id_pago} ha sido eliminado satisfactoriamente`);
  }catch(err){
    if (validateNotFoundInPrisma(err)) {
      return res.status(404).json();
    }   
    loggerMiddleware.error(error.message);
    return res.status(503).json("No se pudo contactar con el servicio");   
  }
}

module.exports = { registrarPago, obtenerPagosCliente, modificarPago, eliminarPago };
