-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('docente', 'admin');

-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('borrador', 'pendiente', 'devuelta', 'en_proceso', 'verificacion', 'cerrada');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('creada', 'enviada', 'devuelta', 'aprobada', 'avance', 'verificacion', 'cerrada', 'reabierta', 'editada');

-- CreateEnum
CREATE TYPE "TipoCatalogo" AS ENUM ('departamento', 'tecnica', 'responsable');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'docente',
    "departamento" TEXT NOT NULL,
    "puesto" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "intentosFallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoHasta" TIMESTAMP(3),
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contadores_folio" (
    "anio" INTEGER NOT NULL,
    "ultimo" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "contadores_folio_pkey" PRIMARY KEY ("anio")
);

-- CreateTable
CREATE TABLE "requisiciones" (
    "id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "folio" TEXT NOT NULL,
    "fechaRegistro" DATE NOT NULL,
    "estado" "Estado" NOT NULL DEFAULT 'borrador',
    "solicitanteId" TEXT NOT NULL,
    "solicitanteNombre" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "responsableDefinir" TEXT NOT NULL DEFAULT '',
    "responsableVerificar" TEXT NOT NULL DEFAULT '',
    "requiereAC" BOOLEAN,
    "requiereCorreccion" BOOLEAN,
    "tecnicaEstadistica" TEXT NOT NULL DEFAULT '',
    "causaRaiz" TEXT NOT NULL DEFAULT '',
    "accionRealizar" TEXT NOT NULL DEFAULT '',
    "observacionesDocente" TEXT NOT NULL DEFAULT '',
    "definio" TEXT NOT NULL DEFAULT '',
    "verifico" TEXT NOT NULL DEFAULT '',
    "causaEliminada" BOOLEAN,
    "obsEficacia" TEXT,
    "fechaCierre" DATE,
    "firmaRD" TEXT,
    "creada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requisiciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acciones_plan" (
    "id" TEXT NOT NULL,
    "requisicionId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "accion" TEXT NOT NULL,
    "responsable" TEXT NOT NULL,
    "fechaProgramada" DATE,
    "evidencia" TEXT NOT NULL,
    "completado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "acciones_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidencias" (
    "id" TEXT NOT NULL,
    "requisicionId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tamano" TEXT NOT NULL,
    "creada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" TEXT NOT NULL,
    "requisicionId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "autor" TEXT NOT NULL,
    "tipo" "TipoEvento" NOT NULL,
    "comentario" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogos" (
    "id" TEXT NOT NULL,
    "tipo" "TipoCatalogo" NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "catalogos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "requisiciones_folio_key" ON "requisiciones"("folio");

-- CreateIndex
CREATE INDEX "requisiciones_solicitanteId_idx" ON "requisiciones"("solicitanteId");

-- CreateIndex
CREATE INDEX "requisiciones_estado_idx" ON "requisiciones"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "requisiciones_anio_numero_key" ON "requisiciones"("anio", "numero");

-- CreateIndex
CREATE INDEX "acciones_plan_requisicionId_idx" ON "acciones_plan"("requisicionId");

-- CreateIndex
CREATE INDEX "evidencias_requisicionId_idx" ON "evidencias"("requisicionId");

-- CreateIndex
CREATE INDEX "eventos_requisicionId_idx" ON "eventos"("requisicionId");

-- CreateIndex
CREATE UNIQUE INDEX "catalogos_tipo_nombre_key" ON "catalogos"("tipo", "nombre");

-- AddForeignKey
ALTER TABLE "requisiciones" ADD CONSTRAINT "requisiciones_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acciones_plan" ADD CONSTRAINT "acciones_plan_requisicionId_fkey" FOREIGN KEY ("requisicionId") REFERENCES "requisiciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidencias" ADD CONSTRAINT "evidencias_requisicionId_fkey" FOREIGN KEY ("requisicionId") REFERENCES "requisiciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_requisicionId_fkey" FOREIGN KEY ("requisicionId") REFERENCES "requisiciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
