/*
  Warnings:

  - You are about to drop the `invitaciones` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "invitaciones";

-- CreateTable
CREATE TABLE "verificaciones_correo" (
    "id" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "codigoHash" TEXT NOT NULL,
    "expira" TIMESTAMP(3) NOT NULL,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "usadaEn" TIMESTAMP(3),
    "creada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verificaciones_correo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "verificaciones_correo_correo_idx" ON "verificaciones_correo"("correo");
