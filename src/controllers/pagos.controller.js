const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Registrar un nuevo pago
 */
const registrarPago = async (req, res) => {
  const { id_credito, monto_pago } = req.body;

  try {
    // Verificar que el crédito existe y está pendiente
    const credito = await prisma.credito.findUnique({
      where: { id_credito },
    });

    if (!credito) {
      return res.status(404).json({ error: "Crédito no encontrado" });
    }

    if (credito.estado === "PAGADO") {
      return res.status(400).json({ error: "El crédito ya está pagado" });
    }

    // Registrar el pago
    const nuevoPago = await prisma.pago.create({
      data: { id_credito, monto_pago },
    });

    // Calcular el total de pagos realizados
    const pagosRealizados = await prisma.pago.aggregate({
      where: { id_credito },
      _sum: { monto_pago: true },
    });

    const totalPagado = pagosRealizados._sum.monto_pago || 0;

    // Verificar si el crédito ha sido pagado completamente
    if (totalPagado >= credito.monto_total) {
      await prisma.credito.update({
        where: { id_credito },
        data: { estado: "PAGADO" },
      });
    }

    res.status(201).json(nuevoPago);
  } catch (error) {
    res.status(500).json({ error: "Error al registrar el pago" });
  }
};

/**
 * Obtener pagos de un cliente
 */
const obtenerPagosCliente = async (req, res) => {


  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id_cliente: parseInt(req.params.id) },
      include: { creditos: { include: { pagos: true } } },
    });

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(cliente.creditos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener pagos del cliente" });
  }
};

/**
 * Modificar un pago existente
 */
const modificarPago = async (req, res) => {
  const { id } = req.params;
  const { monto_pago } = req.body;

  try {
    const pagoExistente = await prisma.pago.findUnique({
      where: { id_pago: parseInt(id) },
    });

    if (!pagoExistente) {
      return res.status(404).json({ error: "Pago no encontrado" });
    }

    const pagoActualizado = await prisma.pago.update({
      where: { id_pago: parseInt(id) },
      data: { monto_pago },
    });

    res.json(pagoActualizado);
  } catch (error) {
    res.status(500).json({ error: "Error al modificar el pago" });
  }
};

const eliminarPago = async (req, res)=> {
  try{
    const milisegundosAHoras = 1000 * 60 * 60;
    const tiempoParaAjuste = 7 * 24;
    const pago = await prisma.pago.findUnique({
      where: {id_pago: parseInt(req.params.id)}
    });
    if (pago == null) { return res.status(404).json("Pago no encontrado"); }
    const horasDesdePago = (new Date() - pago.fecha_pago)/milisegundosAHoras;
    if (horasDesdePago > tiempoParaAjuste) { return res.status(409).json("No se puede eliminar un pago realizado hace más de 7 días")}
    const pagoEliminado = await prisma.pago.delete({
      where: {id_pago: parseInt(req.params.id)}
    });
    if (pagoEliminado == null) { return res.status(503).json();}
    return res.status(200).json(`El pago con id ${pagoEliminado.id_pago} ha sido eliminado satisfactoriamente`);
  }catch(err){
    console.error(err);
    return res.status(503).json();
  }
}

module.exports = { registrarPago, obtenerPagosCliente, modificarPago, eliminarPago };
