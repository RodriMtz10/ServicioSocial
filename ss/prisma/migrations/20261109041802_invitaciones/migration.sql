-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "credencialesActualizadas" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "invitaciones" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "correo" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'docente',
    "expira" TIMESTAMP(3) NOT NULL,
    "usadaEn" TIMESTAMP(3),
    "usadaPorId" TEXT,
    "creadaPor" TEXT NOT NULL,
    "creadaPorNombre" TEXT NOT NULL,
    "creada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revocada" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "invitaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invitaciones_tokenHash_key" ON "invitaciones"("tokenHash");
