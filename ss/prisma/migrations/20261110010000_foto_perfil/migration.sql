-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "fotoActualizada" TIMESTAMP(3),
ADD COLUMN     "fotoClave" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_fotoClave_key" ON "usuarios"("fotoClave");
