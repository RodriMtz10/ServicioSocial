-- AlterTable
ALTER TABLE "evidencias" ADD COLUMN     "accionId" TEXT,
ADD COLUMN     "bytes" INTEGER,
ADD COLUMN     "clave" TEXT,
ADD COLUMN     "mime" TEXT,
ADD COLUMN     "sha256" TEXT,
ADD COLUMN     "subidaPor" TEXT;

-- AlterTable
ALTER TABLE "requisiciones" ADD COLUMN     "recordatorioEn" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "actorNombre" TEXT,
    "actorRol" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "detalle" TEXT,
    "ip" TEXT,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auditoria_fecha_idx" ON "auditoria"("fecha");

-- CreateIndex
CREATE INDEX "auditoria_accion_idx" ON "auditoria"("accion");

-- CreateIndex
CREATE INDEX "auditoria_entidad_entidadId_idx" ON "auditoria"("entidad", "entidadId");

-- CreateIndex
CREATE UNIQUE INDEX "evidencias_clave_key" ON "evidencias"("clave");

-- CreateIndex
CREATE INDEX "evidencias_accionId_idx" ON "evidencias"("accionId");

-- AddForeignKey
ALTER TABLE "evidencias" ADD CONSTRAINT "evidencias_accionId_fkey" FOREIGN KEY ("accionId") REFERENCES "acciones_plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
