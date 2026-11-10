/**
 * Prueba de extremo a extremo contra la aplicación EN MARCHA (con base de datos real, varios usuarios a la vez).
 *   1) npm run dev   (o npm run build && npm start)
 *   2) PRUEBA_ADMIN_CORREO=admin@... PRUEBA_ADMIN_PASSWORD=... npm run prueba:http
 * Crea dos docentes temporales y requisiciones de prueba, ejercita permisos, estados, subida/descarga de archivos,
 * concurrencia y auditoría, y al final BORRA lo que creó. No toca datos existentes.
 * (No envía correos: los recordatorios solo se prueban sin enviarlos.)
 */
try { await import('dotenv/config'); } catch { /* sin dotenv: se usan las variables del sistema */ }

const BASE = (process.env.PRUEBA_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');
const ADMIN = { correo: process.env.PRUEBA_ADMIN_CORREO, password: process.env.PRUEBA_ADMIN_PASSWORD };
if (!ADMIN.correo || !ADMIN.password) { console.error('Define PRUEBA_ADMIN_CORREO y PRUEBA_ADMIN_PASSWORD.'); process.exit(2); }

let ok = 0, mal = 0;
const verifica = (cond, texto, extra) => { if (cond) { ok++; console.log(`  ✓ ${texto}`); } else { mal++; console.log(`  ✗ ${texto}${extra !== undefined ? ` → ${typeof extra === 'string' ? extra : JSON.stringify(extra)}` : ''}`); } };

/** Cliente con su propia «cookie jar» (una sesión por persona). */
function cliente() {
  const jar = new Map();
  const guardar = (res) => { for (const c of res.headers.getSetCookie?.() ?? []) { const [kv] = c.split(';'); const i = kv.indexOf('='); const v = kv.slice(i + 1); if (v === '' || /expires=Thu, 01 Jan 1970/i.test(c)) jar.delete(kv.slice(0, i)); else jar.set(kv.slice(0, i), v); } };
  const cab = () => ({ cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; ') });
  const pedir = async (ruta, { metodo = 'GET', json, form, headers = {} } = {}) => {
    const res = await fetch(BASE + ruta, { method: metodo, redirect: 'manual', headers: { ...cab(), ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers }, body: json !== undefined ? JSON.stringify(json) : form });
    guardar(res);
    return res;
  };
  const api = async (ruta, metodo = 'GET', json) => { const res = await pedir(ruta, { metodo, json }); const t = await res.text(); let d = null; try { d = JSON.parse(t); } catch { /* no json */ } return { status: res.status, data: d, res, texto: t }; };
  const entrar = async (correo, password) => {
    const { csrfToken } = await (await pedir('/api/auth/csrf')).json();
    const res = await pedir('/api/auth/callback/credentials', { metodo: 'POST', form: new URLSearchParams({ csrfToken, email: correo, password, json: 'true' }), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    await res.text();
    const s = await (await pedir('/api/auth/session')).json();
    return !!s?.user?.id;
  };
  const subir = async (id, nombre, contenido, accionId) => {
    const f = new FormData(); f.append('archivo', new Blob([contenido]), nombre); if (accionId) f.append('accionId', accionId);
    const res = await pedir(`/api/requisiciones/${id}/evidencias`, { metodo: 'POST', form: f }); const t = await res.text(); let d = null; try { d = JSON.parse(t); } catch { /* */ }
    return { status: res.status, data: d };
  };
  const bajar = async (id) => { const res = await pedir(`/api/evidencias/${id}`); const b = Buffer.from(await res.arrayBuffer()); return { status: res.status, tipo: res.headers.get('content-type'), disp: res.headers.get('content-disposition'), nosniff: res.headers.get('x-content-type-options'), cuerpo: b }; };
  return { api, entrar, subir, bajar };
}

const sufijo = Date.now().toString(36);
const PW = 'Prueba-Segura-2026!x';
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
const datos = (futuro) => ({
  descripcion: 'No conformidad de prueba automatizada del sistema de acciones correctivas', responsableDefinir: 'Prueba', responsableVerificar: 'Prueba',
  requiereAC: true, requiereCorreccion: false, tecnicaEstadistica: 'Lluvia de ideas', causaRaiz: 'Causa raíz de prueba', accionRealizar: 'Acción de prueba para el plan',
  planAccion: [{ accion: 'Acción uno de prueba', responsable: 'Prueba', fechaProgramada: futuro, evidencia: 'Archivo', completado: false }, { accion: 'Acción dos de prueba', responsable: 'Prueba', fechaProgramada: futuro, evidencia: 'Archivo', completado: false }],
  observacionesDocente: '', definio: 'Prueba', verifico: 'Prueba',
});
const futuro = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

const admin = cliente(), a = cliente(), b = cliente(), anonimo = cliente();
const creados = { reqs: [], usuarios: [] };

try {
  console.log(`Probando ${BASE}`);
  console.log('\nAcceso');
  verifica(await admin.entrar(ADMIN.correo, ADMIN.password), 'El administrador inicia sesión');
  verifica((await anonimo.api('/api/requisiciones')).status === 401, 'Sin sesión la API responde 401');
  verifica((await anonimo.api('/api/auditoria')).status === 401, 'Sin sesión la bitácora responde 401');

  const mk = async (n) => { const r = await admin.api('/api/usuarios', 'POST', { nombre: `Docente Prueba ${n} ${sufijo}`, correo: `prueba.${n}.${sufijo}@example.com`, password: PW, rol: 'docente', departamento: 'Sistema de Gestión Integrado', puesto: 'Docente' }); if (r.status === 201) creados.usuarios.push(r.data.id); return { r, correo: `prueba.${n}.${sufijo}@example.com` }; };
  const ua = await mk('a'), ub = await mk('b');
  verifica(ua.r.status === 201 && ub.r.status === 201, 'El administrador crea dos docentes temporales', [ua.r.status, ua.r.data, ub.r.status]);
  verifica(await a.entrar(ua.correo, PW), 'El docente A inicia sesión') ;
  verifica(await b.entrar(ub.correo, PW), 'El docente B inicia sesión');
  verifica((await a.api('/api/auditoria')).status === 403, 'Un docente no puede ver la bitácora (403)');
  verifica((await a.api('/api/usuarios')).status === 403, 'Un docente no puede listar usuarios (403)');

  console.log('\nFlujo de estados y privacidad');
  const c = await a.api('/api/requisiciones', 'POST', { datos: datos(futuro), enviar: true });
  verifica(c.status === 200 || c.status === 201, 'A crea y envía una requisición', [c.status, c.data]);
  const R = c.data; creados.reqs.push(R.id);
  verifica(R.estado === 'pendiente', 'Queda pendiente', R.estado);
  verifica((await b.api(`/api/requisiciones/${R.id}`)).status === 404, 'B no puede ver la requisición de A');
  verifica(!(await b.api('/api/requisiciones')).data.some((x) => x.id === R.id), 'B no la ve en su lista');
  const [acc1, acc2] = R.planAccion;
  const pend = await a.subir(R.id, 'evidencia.pdf', PDF, acc1.id);
  verifica(pend.status === 409, 'En pendiente el docente no puede adjuntar (409)', pend.status);

  const dos = await Promise.all([admin.api(`/api/requisiciones/${R.id}/transicion`, 'POST', { accion: 'aprobar' }), admin.api(`/api/requisiciones/${R.id}/transicion`, 'POST', { accion: 'aprobar' })]);
  verifica(dos.filter((x) => x.status === 200).length === 1 && dos.filter((x) => x.status === 409).length === 1, 'Dos aprobaciones simultáneas: una gana y otra recibe 409', dos.map((x) => x.status));

  console.log('\nArchivos reales');
  const ok1 = await a.subir(R.id, 'evidencia.pdf', PDF, acc1.id);
  verifica(ok1.status === 200, 'A sube un PDF a la acción 1', [ok1.status, ok1.data]);
  const ev = ok1.data?.evidencias?.find((e) => e.nombre === 'evidencia.pdf');
  verifica(ev?.accionId === acc1.id && ev?.disponible === true, 'La evidencia queda ligada a la acción 1', ev);
  verifica((await a.subir(R.id, 'virus.exe', Buffer.from('MZ....'), acc1.id)).status === 400, 'Se rechaza un .exe');
  verifica((await a.subir(R.id, 'falso.pdf', Buffer.from('esto no es un pdf'), acc1.id)).status === 400, 'Se rechaza un «pdf» cuyo contenido no lo es');
  verifica((await a.subir(R.id, 'doble.pdf.exe', PDF, acc1.id)).status === 400, 'Se rechaza doble extensión peligrosa');
  verifica((await a.subir(R.id, 'vacio.pdf', Buffer.alloc(0), acc1.id)).status === 400, 'Se rechaza un archivo vacío');
  verifica((await a.subir(R.id, 'a.pdf', PDF, 'no-existe')).status === 404, 'Se rechaza una acción que no existe');
  const grande = Buffer.concat([PDF, Buffer.alloc(9 * 1024 * 1024)]);
  verifica([400, 413].includes((await a.subir(R.id, 'grande.pdf', grande, acc2.id)).status), 'Se rechaza un archivo de más de 8 MB');
  const d1 = await a.bajar(ev.id);
  verifica(d1.status === 200 && d1.cuerpo.equals(PDF) && /pdf/.test(d1.tipo ?? '') && d1.nosniff === 'nosniff', 'A descarga su archivo idéntico, con nosniff', [d1.status, d1.tipo]);
  verifica((await b.bajar(ev.id)).status === 404, 'B no puede descargar el archivo de A');
  verifica((await anonimo.bajar(ev.id)).status === 401, 'Sin sesión no se descarga (401)');
  verifica((await admin.bajar(ev.id)).status === 200, 'El administrador sí puede descargarlo');
  const bs = await b.subir(R.id, 'b.pdf', PDF);
  verifica(bs.status === 404 || bs.status === 403, 'B no puede adjuntar a la requisición de A', bs.status);

  console.log('\nVerificación bloqueada');
  verifica((await a.api(`/api/requisiciones/${R.id}/transicion`, 'POST', { accion: 'cambiar_estado', estado: 'verificacion' })).status === 200, 'A pasa a verificación');
  verifica((await a.subir(R.id, 'tarde.pdf', PDF, acc2.id)).status === 409, 'En verificación el docente no puede adjuntar (409)');
  verifica((await a.api(`/api/requisiciones/${R.id}/transicion`, 'POST', { accion: 'marcar', accionId: acc1.id, completado: true })).status === 409, 'En verificación no puede marcar acciones (409)');
  verifica((await a.api(`/api/requisiciones/${R.id}/transicion`, 'POST', { accion: 'quitar_evidencia', evidenciaId: ev.id })).status === 409, 'En verificación no puede quitar evidencias (409)');
  verifica((await admin.subir(R.id, 'admin.pdf', PDF, acc2.id)).status === 200, 'El administrador sí puede adjuntar en cualquier estado');
  verifica((await admin.api(`/api/requisiciones/${R.id}/transicion`, 'POST', { accion: 'devolver', comentario: 'Prueba' })).data?.estado === 'en_proceso', 'El administrador devuelve a «en proceso»');
  const q = await a.api(`/api/requisiciones/${R.id}/transicion`, 'POST', { accion: 'quitar_evidencia', evidenciaId: ev.id });
  verifica(q.status === 200 && !q.data.evidencias.some((e) => e.id === ev.id), 'A quita su evidencia en proceso', q.status);
  verifica((await a.bajar(ev.id)).status === 404, 'El archivo quitado ya no se puede descargar');

  console.log('\nAuditoría y recordatorios');
  const au = await admin.api('/api/auditoria?accion=evidencia');
  verifica(au.status === 200 && au.data.filas.some((f) => f.accion === 'evidencia.subir'), 'La bitácora registra las subidas', au.status);
  verifica((await admin.api('/api/auditoria?accion=login')).data.filas.some((f) => f.accion === 'login.ok'), 'La bitácora registra los inicios de sesión');
  verifica((await admin.api('/api/auditoria?accion=requisicion')).data.filas.some((f) => f.accion === 'requisicion.aprobar'), 'La bitácora registra la aprobación');
  const csv = await admin.api('/api/auditoria?formato=csv');
  verifica(csv.status === 200 && csv.texto.includes('Fecha'), 'Se exporta la bitácora en CSV');
  verifica((await a.api('/api/recordatorios', 'POST')).status === 403, 'Un docente no puede disparar recordatorios (403)');
  verifica((await admin.api('/api/recordatorios')).status === 200, 'El administrador consulta las vencidas');
  const mal401 = await fetch(`${BASE}/api/recordatorios`, { method: 'POST', headers: { Authorization: 'Bearer incorrecto-incorrecto-123' } });
  verifica(mal401.status === 401, 'Un token de cron incorrecto se rechaza (401)', mal401.status);

  console.log('\nContraseñas y bloqueo');
  const x = cliente();
  for (let i = 0; i < 6; i++) await x.entrar(ua.correo, 'incorrecta-' + i);
  verifica(!(await x.entrar(ua.correo, PW)), 'Tras varios intentos fallidos la cuenta queda bloqueada temporalmente');
  const bl = await admin.api('/api/auditoria?accion=login');
  verifica(bl.data.filas.some((f) => /bloquead/.test(f.accion)), 'El bloqueo queda en la bitácora');
} catch (e) {
  mal++; console.log(`  ✗ Error inesperado: ${e.stack || e}`);
} finally {
  console.log('\nLimpieza');
  for (const id of creados.reqs) { const r = await admin.api(`/api/requisiciones/${id}`, 'DELETE'); console.log(`  requisición ${id}: ${r.status}`); }
  for (const id of creados.usuarios) { const r = await admin.api(`/api/usuarios/${id}`, 'DELETE'); console.log(`  usuario ${id}: ${r.status}`); }
}
console.log(`\n${mal ? '✗' : '✓'} ${ok} correctas, ${mal} con problemas.`);
process.exit(mal ? 1 : 0);
