# SGI · Requisición de Acciones Correctivas (ITMORELIA-IT-CA-004-01)

Next.js 16 + React 19 + PostgreSQL (Prisma 7) + next-auth. Instituto Tecnológico de Morelia / TecNM.

## Puesta en marcha

```bash
# 1. Variables de entorno
cp .env.example .env            # y escribe NEXTAUTH_SECRET:  openssl rand -base64 32

# 2. PostgreSQL (opción rápida con Docker; si ya tienes uno, solo ajusta DATABASE_URL en .env)
docker compose up -d

# 3. Dependencias (también ejecuta "prisma generate")
npm install

# 4. Crear las tablas
npx prisma migrate dev --name init

# 5. Primer administrador (no hay usuarios de prueba)
npm run db:crear-admin -- --nombre "Nombre Apellido" --correo admin@morelia.tecnm.mx --password "una-contraseña-larga"

# 6. (Opcional) técnicas estadísticas habituales del formato
npm run db:catalogos-base

# 7. Arrancar
npm run dev                     # http://localhost:3000
```

Después entra con ese administrador → **Usuarios y catálogos** para dar de alta a los docentes, departamentos y responsables.

En producción: `npx prisma migrate deploy` (`npm run db:desplegar`) en lugar de `migrate dev`, y un `NEXTAUTH_SECRET` propio.

## Seguridad

- **Registro con verificación de correo**: la persona escribe su correo institucional (solo dominios de `REGISTRO_DOMINIOS`) y recibe un código de 6 dígitos que vence en 15 minutos, admite 5 intentos y sirve una vez. Solo se guarda su HMAC. Siempre crea un docente; los administradores los crea otro administrador. El envío usa SMTP (`SMTP_*` en `.env`); sin SMTP, en desarrollo el código se imprime en la terminal de `npm run dev`.
- **Listas cerradas**: departamentos y puestos salen de `lib/institucional.ts` (se validan también en el servidor); responsables y personas del formulario son listas desplegables.
- Contraseñas: mínimo 8, letras y números, sin contraseñas comunes ni el correo dentro; bcrypt (costo 12). Al cambiarla (tú o el administrador) se cierran las sesiones anteriores.
- Límites de intentos: bloqueo de cuenta (5 fallos / 15 min), límite por IP en login y registro, y límite de códigos por correo.
- La API siempre consulta la base de datos para saber rol y estado del usuario; el `proxy.ts` solo redirige. Protección CSRF por origen en toda la API, cuerpo máximo de 256 KB y respuestas `no-store`.
- Cabeceras HTTP: CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy y HSTS (en `next.config.ts`).
- Los limitadores viven en memoria: bastan para un solo servidor; con varias instancias hay que moverlos a Redis/BD.

## Qué hay

| Rol | Puede |
|---|---|
| Docente | Crear / editar borradores, enviar, corregir devueltas, marcar avance del plan, solicitar verificación, ver solo lo suyo |
| Administrador (SGI) | Aprobar, devolver, verificar y cerrar, **editar cualquier requisición en cualquier estado** (queda en el historial con su nombre y motivo), reportes, usuarios y catálogos |

- La autorización real está en `app/api/**` (`lib/server/actor.ts` consulta la base de datos en cada petición; `proxy.ts` solo redirige).
- Folios `AC-ITM-AAAA-NNN` consecutivos por año, asignados en el servidor dentro de una transacción.
- Las fechas se calculan con la hora de México, no la del servidor.
- Logos: `public/logo-tecnm.png`, `public/logo-tecnm-blanco.png`, `public/logo-itm.png`, `app/icon.png`.

## Limitaciones conocidas

- Evidencias: solo se guarda nombre y tamaño del archivo; la subida real (disco/S3) es una fase posterior.
- Los listados cargan todas las requisiciones visibles (sin paginación todavía).
- Sin recuperación de contraseña por correo: el administrador restablece contraseñas desde **Usuarios y catálogos**.

## Archivos de evidencia, auditoría, recordatorios y respaldos

- **Evidencias reales**: se suben a la acción del plan correspondiente (o como evidencia general) desde la vista de la requisición. El servidor valida nombre, tamaño (máx. 8 MB) y contenido real del archivo, lo guarda en `ALMACEN_DIR` (por defecto `storage/evidencias`) con nombre aleatorio y registra su huella SHA-256. Solo se descargan por `/api/evidencias/[id]` con permiso sobre la requisición. El docente adjunta únicamente en «en proceso»; el administrador, en cualquier estado.
- **Bitácora** (`/dashboard/auditoria`, solo administradores): inicios de sesión (incluidos fallidos y bloqueos), cambios de requisiciones, archivos, usuarios, catálogos y recordatorios. Filtros, búsqueda y exportación CSV.
- **Acciones vencidas**: panel en el tablero y en «Mis solicitudes». El administrador puede enviar recordatorios por correo con un botón, o programarlos: `CRON_SECRET` en `.env` + `npm run recordatorios` (una vez al día). La misma requisición se vuelve a avisar cada `RECORDATORIO_DIAS` días (3 por defecto).
- **Respaldos**: `npm run respaldo` (base de datos + evidencias + huellas) y `npm run restaurar -- respaldos/<carpeta> --confirmar`. Requiere `pg_dump`/`psql` en el equipo o la base levantada con `docker compose up -d`. Copia la carpeta `respaldos` a otro disco o nube.
- **Verificación**: `npm run verificar` revisa `.env`, la base, el almacén y el SMTP real (con `SMTP_PROBAR_A=correo` envía un correo de prueba). `npm run prueba:http` prueba la aplicación en marcha con varios usuarios (`PRUEBA_ADMIN_CORREO` y `PRUEBA_ADMIN_PASSWORD`); crea y borra sus propios datos de prueba.
- Tras actualizar: `npx prisma migrate dev` (aplica `archivos_auditoria`) y `npx prisma generate`.
