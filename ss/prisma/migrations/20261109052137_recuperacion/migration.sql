-- DropIndex
DROP INDEX "verificaciones_correo_correo_idx";

-- AlterTable
ALTER TABLE "verificaciones_correo" ADD COLUMN     "proposito" TEXT NOT NULL DEFAULT 'registro';

-- CreateIndex
CREATE INDEX "verificaciones_correo_correo_proposito_idx" ON "verificaciones_correo"("correo", "proposito");
