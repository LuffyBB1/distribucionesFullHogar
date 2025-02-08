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
  const { id_cliente } = req.params;

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id_cliente: parseInt(id_cliente) },
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
  const { id_pago } = req.params;
  const { monto_pago } = req.body;

  try {
    const pagoExistente = await prisma.pago.findUnique({
      where: { id_pago: parseInt(id_pago) },
    });

    if (!pagoExistente) {
      return res.status(404).json({ error: "Pago no encontrado" });
    }

    const pagoActualizado = await prisma.pago.update({
      where: { id_pago: parseInt(id_pago) },
      data: { monto_pago },
    });

    res.json(pagoActualizado);
  } catch (error) {
    res.status(500).json({ error: "Error al modificar el pago" });
  }
};

module.exports = { registrarPago, obtenerPagosCliente, modificarPago };
