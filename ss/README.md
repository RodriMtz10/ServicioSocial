# ss · aplicación

La documentación completa (instalación, variables de entorno, scripts, seguridad y despliegue) está en el [README principal](../README.md).

Inicio rápido: `cp .env.example .env` → `docker compose up -d` → `npm install` → `npx prisma migrate dev` → `npm run db:crear-admin` → `npm run dev`.
=======

## Archivos de evidencia, auditoría, recordatorios y respaldos

- **Evidencias reales**: se suben a la acción del plan correspondiente (o como evidencia general) desde la vista de la requisición. El servidor valida nombre, tamaño (máx. 8 MB) y contenido real del archivo, lo guarda en `ALMACEN_DIR` (por defecto `storage/evidencias`) con nombre aleatorio y registra su huella SHA-256. Solo se descargan por `/api/evidencias/[id]` con permiso sobre la requisición. El docente adjunta únicamente en «en proceso»; el administrador, en cualquier estado.
- **Bitácora** (`/dashboard/auditoria`, solo administradores): inicios de sesión (incluidos fallidos y bloqueos), cambios de requisiciones, archivos, usuarios, catálogos y recordatorios. Filtros, búsqueda y exportación CSV.
- **Acciones vencidas**: panel en el tablero y en «Mis solicitudes». El administrador puede enviar recordatorios por correo con un botón, o programarlos: `CRON_SECRET` en `.env` + `npm run recordatorios` (una vez al día). La misma requisición se vuelve a avisar cada `RECORDATORIO_DIAS` días (3 por defecto).
- **Respaldos**: `npm run respaldo` (base de datos + evidencias + huellas) y `npm run restaurar -- respaldos/<carpeta> --confirmar`. Requiere `pg_dump`/`psql` en el equipo o la base levantada con `docker compose up -d`. Copia la carpeta `respaldos` a otro disco o nube.
- **Verificación**: `npm run verificar` revisa `.env`, la base, el almacén y el SMTP real (con `SMTP_PROBAR_A=correo` envía un correo de prueba). `npm run prueba:http` prueba la aplicación en marcha con varios usuarios (`PRUEBA_ADMIN_CORREO` y `PRUEBA_ADMIN_PASSWORD`); crea y borra sus propios datos de prueba.
- Tras actualizar: `npx prisma migrate dev` (aplica `archivos_auditoria`) y `npx prisma generate`.
>>>>>>> a22fd8e319a616a1b233bb9bf66b785338f9ebfb
