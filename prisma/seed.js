const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Cargando datos de prueba...");

  // Crear clientes con estado_credito
  const cliente1 = await prisma.cliente.create({
    data: {
      nombre: "Juan Pérez",
      telefono: "123456789",
      direccion: "Calle 123, Ciudad",
      documentoIdentidad: "100200300",
      email: "juan@example.com",
      estado_credito: true, // Cliente con crédito activo
    },
  });

  const cliente2 = await prisma.cliente.create({
    data: {
      nombre: "Ana Gómez",
      telefono: "987654321",
      direccion: "Avenida 456, Ciudad",
      documentoIdentidad: "400500600",
      email: "ana@example.com",
      estado_credito: false, // Cliente sin créditos pendientes
    },
  });

  console.log("Clientes creados:", cliente1, cliente2);

  // Crear créditos solo para clientes con estado_credito = true
  const credito1 = await prisma.credito.create({
    data: {
      id_cliente: cliente1.id_cliente,
      monto_total: 500.00,
      cuotas: 5,
      frecuencia_pago: "MENSUAL",
      estado: "PENDIENTE",
    },
  });

  console.log("Crédito creado:", credito1);

  // Crear pagos de prueba
  await prisma.pago.createMany({
    data: [
      { id_credito: credito1.id_credito, monto_pago: 100.00 },
      { id_credito: credito1.id_credito, monto_pago: 150.00 },
    ],
  });

  console.log("Pagos creados.");

  console.log("Datos de prueba cargados exitosamente.");
}

main()
  .catch((error) => {
    console.error("Error cargando datos de prueba:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
