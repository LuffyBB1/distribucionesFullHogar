-- AlterTable
ALTER TABLE "Cliente" ALTER COLUMN "estado_credito" SET DEFAULT true;

-- CreateTable
CREATE TABLE "Credito" (
    "id_credito" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "monto_total" INTEGER NOT NULL,
    "cuotas" INTEGER NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "frecuencia_pago" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT "Credito_pkey" PRIMARY KEY ("id_credito")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id_pago" SERIAL NOT NULL,
    "id_credito" INTEGER NOT NULL,
    "monto_pago" INTEGER NOT NULL,
    "fecha_pago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id_pago")
);

-- AddForeignKey
ALTER TABLE "Credito" ADD CONSTRAINT "Credito_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "Cliente"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_id_credito_fkey" FOREIGN KEY ("id_credito") REFERENCES "Credito"("id_credito") ON DELETE RESTRICT ON UPDATE CASCADE;
