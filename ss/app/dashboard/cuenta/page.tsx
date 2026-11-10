'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { cerrarSesion } from '@/lib/cerrarSesion';
import { Campo, inputCls } from '@/components/ui/Campo';
import { Skeleton, Spinner } from '@/components/ui/Cargando';
import { useAvisos } from '@/lib/avisos';
import { PasswordInput, RequisitosPassword } from '@/components/ui/PasswordInput';
import { SelectDepartamento, SelectPuesto } from '@/components/ui/ListasInstitucionales';
import { api, ApiError, subirArchivo } from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import { prepararFoto } from '@/lib/imagen';
import { useUsuario } from '@/lib/useUsuario';
import type { Usuario } from '@/types';

type Msg = { ok: boolean; t: string } | null;
const mensajeDe = (err: unknown): { t: string; campos: Record<string, string> } =>
  err instanceof ApiError ? { t: err.message, campos: err.errores ?? {} } : { t: 'Error inesperado', campos: {} };
const boton = 'accion px-5 py-3 sm:py-2.5 rounded-xl bg-[#0F3470] text-white text-xs font-bold hover:bg-[#0A2552] disabled:opacity-60 cursor-pointer';

/** Foto de perfil: se recorta y reduce en el navegador antes de subirla. */
function FotoPerfil() {
  const { usuario } = useUsuario();
  const { update } = useSession();
  const avisos = useAvisos();
  const [ocupado, setOcupado] = useState(false);
  if (!usuario) return null;

  const subir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setOcupado(true);
    try {
      const blob = await prepararFoto(f);
      await subirArchivo<Usuario>('/api/cuenta/foto', { foto: blob }, 'foto.jpg');
      await update();
      avisos.ok('Foto de perfil actualizada.');
    } catch (err) { avisos.error(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'No se pudo subir la foto'); } finally { setOcupado(false); }
  };
  const quitar = async () => {
    setOcupado(true);
    try { await api('/api/cuenta/foto', 'DELETE'); await update(); avisos.ok('Foto de perfil quitada.'); } catch (err) { avisos.error(err instanceof ApiError ? err.message : 'No se pudo quitar la foto'); } finally { setOcupado(false); }
  };

  return (
    <section className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-xs" aria-labelledby="t-foto">
      <h2 id="t-foto" className="text-sm font-bold text-[#0F3470] uppercase border-b border-gray-100 pb-3 mb-4">Foto de perfil</h2>
      <div className="flex flex-wrap items-center gap-5">
        <Avatar nombre={usuario.nombre} foto={usuario.foto} clase="w-24 h-24 text-2xl" />
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <label className={`${boton} inline-flex items-center gap-2 ${ocupado ? 'opacity-60 pointer-events-none' : ''}`}>
              {ocupado ? <><Spinner />Procesando…</> : usuario.foto ? 'Cambiar foto' : 'Subir foto'}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={subir} className="sr-only" aria-label="Elegir foto de perfil" />
            </label>
            {usuario.foto && <button type="button" onClick={quitar} disabled={ocupado} className="px-5 py-3 sm:py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 disabled:opacity-60 cursor-pointer">Quitar foto</button>}
          </div>
          <p className="text-[11px] text-gray-400">JPG, PNG o WEBP. Se recorta en cuadrado y se reduce automáticamente. Solo tú y los administradores la ven.</p>
        </div>
      </div>
    </section>
  );
}

/** Datos personales: cualquier usuario (docente o administrador) puede cambiarlos cuando quiera. */
function Perfil() {
  const { update } = useSession();
  const [f, setF] = useState<{ nombre: string; departamento: string; puesto: string; correo: string; rol: string } | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const avisos = useAvisos();
  const setMsg = (m: Msg) => { if (m) (m.ok ? avisos.ok(m.t) : avisos.error(m.t)); };
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api<Usuario>('/api/cuenta').then((u) => setF({ nombre: u.nombre, departamento: u.departamento, puesto: u.puesto, correo: u.correo, rol: u.rol })).catch((e) => setMsg({ ok: false, t: mensajeDe(e).t }));
  }, []);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f) return;
    setMsg(null); setErrores({}); setEnviando(true);
    try {
      await api('/api/cuenta', 'PATCH', { nombre: f.nombre, departamento: f.departamento, puesto: f.puesto });
      await update(); // refresca el nombre del menú superior
      setMsg({ ok: true, t: 'Datos actualizados.' });
    } catch (err) { const m = mensajeDe(err); setErrores(m.campos); setMsg({ ok: false, t: m.t }); } finally { setEnviando(false); }
  };

  return (
    <form onSubmit={guardar} className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4" aria-labelledby="t-perfil">
      <h2 id="t-perfil" className="text-sm font-bold text-[#0F3470] uppercase border-b border-gray-100 pb-3">Mis datos</h2>
      {!f ? <div className="space-y-3" role="status"><span className="sr-only">Cargando…</span>{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div> : (
        <>
          <Campo label="Nombre completo" error={errores.nombre}><input autoComplete="name" required value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} className={inputCls(errores.nombre)} /></Campo>
          <Campo label="Departamento o carrera" error={errores.departamento}><SelectDepartamento required value={f.departamento} onChange={(v) => setF({ ...f, departamento: v })} clase={inputCls(errores.departamento)} /></Campo>
          <Campo label="Puesto" error={errores.puesto}><SelectPuesto required value={f.puesto} onChange={(v) => setF({ ...f, puesto: v })} clase={inputCls(errores.puesto)} /></Campo>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Correo institucional"><input readOnly value={f.correo} className={`${inputCls()} bg-gray-50 text-gray-500`} /></Campo>
            <Campo label="Rol"><input readOnly value={f.rol === 'admin' ? 'Administrador SGI' : 'Docente'} className={`${inputCls()} bg-gray-50 text-gray-500`} /></Campo>
          </div>
          <p className="text-[11px] text-gray-400">El correo y el rol solo los puede cambiar un administrador.</p>
              <button disabled={enviando} className={boton}>{enviando ? <span className="inline-flex items-center gap-2"><Spinner />Guardando…</span> : 'Guardar mis datos'}</button>
        </>
      )}
    </form>
  );
}

function CambiarPassword() {
  const [f, setF] = useState({ actual: '', nueva: '', repetir: '' });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const avisos = useAvisos();
  const setMsg = (m: Msg) => { if (m) (m.ok ? avisos.ok(m.t) : avisos.error(m.t)); };
  const [enviando, setEnviando] = useState(false);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null); setErrores({});
    if (f.nueva !== f.repetir) { setErrores({ repetir: 'No coincide con la nueva contraseña' }); return; }
    setEnviando(true);
    try {
      await api('/api/cuenta/password', 'POST', { actual: f.actual, nueva: f.nueva });
      setF({ actual: '', nueva: '', repetir: '' });
      setMsg({ ok: true, t: 'Contraseña actualizada. Por seguridad se cerrarán tus sesiones; vuelve a iniciar sesión.' });
      setTimeout(() => { void cerrarSesion(); }, 1800);
    } catch (err) { const m = mensajeDe(err); setErrores(m.campos); setMsg({ ok: false, t: m.t }); } finally { setEnviando(false); }
  };

  return (
    <form onSubmit={guardar} className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4" aria-labelledby="t-pass">
      <h2 id="t-pass" className="text-sm font-bold text-[#0F3470] uppercase border-b border-gray-100 pb-3">Cambiar contraseña</h2>
      <Campo label="Contraseña actual" error={errores.actual}><PasswordInput autoComplete="current-password" required value={f.actual} onChange={(e) => setF({ ...f, actual: e.target.value })} claseInput={inputCls(errores.actual)} /></Campo>
      <Campo label="Nueva contraseña" error={errores.nueva}><PasswordInput autoComplete="new-password" required maxLength={72} value={f.nueva} onChange={(e) => setF({ ...f, nueva: e.target.value })} claseInput={inputCls(errores.nueva)} /></Campo>
      <Campo label="Repite la nueva contraseña" error={errores.repetir}><PasswordInput autoComplete="new-password" required maxLength={72} value={f.repetir} onChange={(e) => setF({ ...f, repetir: e.target.value })} claseInput={inputCls(errores.repetir)} /></Campo>
      <RequisitosPassword password={f.nueva} repetir={f.repetir} />
      <button disabled={enviando} className={boton}>{enviando ? <span className="inline-flex items-center gap-2"><Spinner />Guardando…</span> : 'Actualizar contraseña'}</button>
    </form>
  );
}

export default function CuentaPage() {
  const { usuario } = useUsuario();
  return (
    <div className="max-w-xl mx-auto space-y-5 font-sans">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Mi perfil</h1>
        <p className="text-xs text-gray-500 mt-0.5">{usuario?.nombre} · {usuario?.correo}</p>
      </div>
      <FotoPerfil />
      <Perfil />
      <CambiarPassword />
    </div>
  );
}
