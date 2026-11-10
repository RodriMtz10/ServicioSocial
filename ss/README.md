# ss · aplicación

La documentación completa (instalación, variables de entorno, scripts, seguridad y despliegue) está en el [README principal](../README.md).

<<<<<<< Updated upstream
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
=======
Inicio rápido: `cp .env.example .env` → `docker compose up -d` → `npm install` → `npx prisma migrate dev` → `npm run db:crear-admin` → `npm run dev`.
>>>>>>> Stashed changes
