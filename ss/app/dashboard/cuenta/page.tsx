'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { cerrarSesion } from '@/lib/cerrarSesion';
import { Campo, inputCls } from '@/components/ui/Campo';
import { Skeleton, Spinner } from '@/components/ui/Cargando';
import { PasswordInput, RequisitosPassword } from '@/components/ui/PasswordInput';
import { SelectDepartamento, SelectPuesto } from '@/components/ui/ListasInstitucionales';
import { api, ApiError } from '@/lib/api';
import { useUsuario } from '@/lib/useUsuario';
import type { Usuario } from '@/types';

type Msg = { ok: boolean; t: string } | null;
const mensajeDe = (err: unknown): { t: string; campos: Record<string, string> } =>
  err instanceof ApiError ? { t: err.message, campos: err.errores ?? {} } : { t: 'Error inesperado', campos: {} };
const boton = 'px-5 py-3 sm:py-2.5 rounded-xl bg-[#0F3470] text-white text-xs font-bold hover:bg-[#0A2552] disabled:opacity-60 cursor-pointer';

/** Datos personales: cualquier usuario (docente o administrador) puede cambiarlos cuando quiera. */
function Perfil() {
  const { update } = useSession();
  const [f, setF] = useState<{ nombre: string; departamento: string; puesto: string; correo: string; rol: string } | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<Msg>(null);
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
          {msg && <p role="status" className={`text-xs font-semibold ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg.t}</p>}
          <button disabled={enviando} className={boton}>{enviando ? <span className="inline-flex items-center gap-2"><Spinner />Guardando…</span> : 'Guardar mis datos'}</button>
        </>
      )}
    </form>
  );
}

function CambiarPassword() {
  const [f, setF] = useState({ actual: '', nueva: '', repetir: '' });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<Msg>(null);
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
      {msg && <p role="status" className={`text-xs font-semibold ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg.t}</p>}
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
      <Perfil />
      <CambiarPassword />
    </div>
  );
}
