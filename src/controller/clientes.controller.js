const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const obtenerClientes = async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener clientes" });
  }
};

const crearCliente = async (req, res) => {
  const { nombre, telefono, direccion, documentoIdentidad, email } = req.body;
  try {
    const nuevoCliente = await prisma.cliente.create({
      data: { nombre, telefono, direccion, documentoIdentidad, email },
    });
    res.status(201).json(nuevoCliente);
  } catch (error) {
    res.status(400).json({ error: "Error al registrar cliente" });
  }
};

module.exports = { obtenerClientes, crearCliente };
