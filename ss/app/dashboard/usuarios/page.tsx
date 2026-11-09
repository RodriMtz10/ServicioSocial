'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyRound, Pencil, Search, Trash2, UserPlus } from 'lucide-react';
import RequireRole from '@/components/auth/RequireRole';
import { Badge } from '@/components/ui/Badge';
import { Campo, inputCls } from '@/components/ui/Campo';
import Modal from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Cargando';
import { SelectDepartamento, SelectPuesto } from '@/components/ui/ListasInstitucionales';
import { PasswordInput, RequisitosPassword } from '@/components/ui/PasswordInput';
import { api, ApiError } from '@/lib/api';
import { useUsuario } from '@/lib/useUsuario';
import { iniciales } from '@/lib/utils';
import type { Role, Usuario } from '@/types';

const btn = 'flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors';
type Errores = Record<string, string>;

function errorDe(e: unknown): { msg: string; campos: Errores } {
  return e instanceof ApiError ? { msg: e.message, campos: e.errores ?? {} } : { msg: 'Error inesperado', campos: {} };
}

/** Formulario compartido por "Nuevo usuario" y "Editar usuario". */
function ModalUsuario({ usuario, esYo, onClose, onGuardado }: {
  usuario?: Usuario; esYo?: boolean; onClose: () => void; onGuardado: (u: Usuario) => void;
}) {
  const editando = !!usuario;
  const [f, setF] = useState({
    nombre: usuario?.nombre ?? '', correo: usuario?.correo ?? '', departamento: usuario?.departamento ?? '', puesto: usuario?.puesto ?? '',
    rol: (usuario?.rol ?? 'docente') as Role, activo: usuario?.activo ?? true, password: '',
  });
  const [errores, setErrores] = useState<Errores>({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const guardar = async () => {
    setEnviando(true); setError(''); setErrores({});
    try {
      const u = editando
        ? await api<Usuario>(`/api/usuarios/${usuario!.id}`, 'PATCH', { nombre: f.nombre, correo: f.correo, departamento: f.departamento, puesto: f.puesto, ...(esYo ? {} : { rol: f.rol, activo: f.activo }) })
        : await api<Usuario>('/api/usuarios', 'POST', { nombre: f.nombre, correo: f.correo, departamento: f.departamento, puesto: f.puesto, rol: f.rol, password: f.password });
      onGuardado(u);
      onClose();
    } catch (e) {
      const { msg, campos } = errorDe(e);
      setError(msg); setErrores(campos);
    } finally { setEnviando(false); }
  };

  return (
    <Modal titulo={editando ? `Editar usuario` : 'Registrar nuevo usuario'} onClose={onClose} pie={
      <>
        <button className={`${btn} border border-gray-300 text-gray-600`} onClick={onClose}>Cancelar</button>
        <button className={`${btn} bg-[#0F3470] text-white disabled:opacity-50`} disabled={enviando} onClick={guardar}>{enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear usuario'}</button>
      </>
    }>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2"><Campo label="Nombre completo" error={errores.nombre}><input autoFocus value={f.nombre} onChange={(e) => set('nombre', e.target.value)} className={inputCls(errores.nombre)} /></Campo></div>
        <div className="sm:col-span-2"><Campo label="Correo institucional (con el que inicia sesión)" error={errores.correo}><input type="email" value={f.correo} onChange={(e) => set('correo', e.target.value)} placeholder="usuario@morelia.tecnm.mx" className={inputCls(errores.correo)} /></Campo></div>
        <Campo label="Departamento o carrera" error={errores.departamento}>
          <SelectDepartamento value={f.departamento} onChange={(v) => set('departamento', v)} clase={inputCls(errores.departamento)} />
        </Campo>
        <Campo label="Puesto" error={errores.puesto}><SelectPuesto value={f.puesto} onChange={(v) => set('puesto', v)} clase={inputCls(errores.puesto)} /></Campo>
        <Campo label="Rol"><select disabled={esYo} value={f.rol} onChange={(e) => set('rol', e.target.value as Role)} className={inputCls()}><option value="docente">Docente</option><option value="admin">Administrador SGI</option></select></Campo>
        {editando ? (
          <Campo label="Acceso al sistema">
            <label className={`flex items-center gap-2 text-xs ${esYo ? 'opacity-50' : 'cursor-pointer'}`}>
              <input type="checkbox" disabled={esYo} checked={f.activo} onChange={(e) => set('activo', e.target.checked)} className="w-4 h-4 accent-[#0F3470]" /> Usuario activo
            </label>
          </Campo>
        ) : (
          <Campo label="Contraseña inicial" error={errores.password}><PasswordInput autoComplete="new-password" maxLength={72} value={f.password} onChange={(e) => set('password', e.target.value)} claseInput={inputCls(errores.password)} /><div className="mt-2"><RequisitosPassword password={f.password} /></div></Campo>
        )}
      </div>
      {esYo && <p className="text-[11px] text-gray-500">Es tu propia cuenta: no puedes quitarte el rol de administrador ni desactivarte.</p>}
      {error && <p role="alert" className="text-[11px] font-semibold text-red-600">{error}</p>}
    </Modal>
  );
}

function ModalPassword({ u, onClose }: { u: Usuario; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const guardar = async () => {
    setError('');
    try { await api(`/api/usuarios/${u.id}`, 'PATCH', { password }); setOk(true); } catch (e) { const { msg, campos } = errorDe(e); setError(campos.password ?? msg); }
  };
  return (
    <Modal titulo={`Nueva contraseña · ${u.nombre}`} onClose={onClose} pie={
      <>
        <button className={`${btn} border border-gray-300 text-gray-600`} onClick={onClose}>{ok ? 'Cerrar' : 'Cancelar'}</button>
        {!ok && <button className={`${btn} bg-[#0F3470] text-white`} onClick={guardar}>Guardar contraseña</button>}
      </>
    }>
      {ok ? <p className="text-xs text-emerald-700 font-semibold">Contraseña actualizada. Si la cuenta estaba bloqueada por intentos fallidos, también se desbloqueó.</p> : (
        <Campo label="Nueva contraseña"><PasswordInput autoFocus autoComplete="new-password" maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} claseInput={inputCls()} /><div className="mt-2"><RequisitosPassword password={password} /></div></Campo>
      )}
      {error && <p role="alert" className="text-[11px] font-semibold text-red-600">{error}</p>}
    </Modal>
  );
}

/** Confirmación para eliminar. Si el usuario tiene requisiciones el servidor lo impide y se ofrece desactivarlo. */
function ModalEliminar({ u, onClose, onEliminado, onDesactivar }: { u: Usuario; onClose: () => void; onEliminado: () => void; onDesactivar: () => Promise<void> }) {
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const eliminar = async () => {
    setEnviando(true); setError('');
    try { await api(`/api/usuarios/${u.id}`, 'DELETE'); onEliminado(); onClose(); } catch (e) { setError(errorDe(e).msg); } finally { setEnviando(false); }
  };
  return (
    <Modal titulo="Eliminar usuario" onClose={onClose} pie={
      <>
        <button className={`${btn} border border-gray-300 text-gray-600`} onClick={onClose}>Cancelar</button>
        {error && u.activo
          ? <button className={`${btn} bg-[#0F3470] text-white`} onClick={async () => { await onDesactivar(); onClose(); }}>Desactivar en su lugar</button>
          : !error && <button className={`${btn} bg-red-600 text-white hover:bg-red-700 disabled:opacity-50`} disabled={enviando} onClick={eliminar}>{enviando ? 'Eliminando…' : 'Sí, eliminar'}</button>}
      </>
    }>
      <p className="text-sm text-slate-700">¿Seguro que quieres eliminar a <b>{u.nombre}</b> <span className="text-gray-500 break-all">({u.correo})</span>?</p>
      <p className="text-xs text-gray-500">Esta acción no se puede deshacer. Solo se puede eliminar a quien no ha creado requisiciones; si las tiene, desactívalo para quitarle el acceso sin perder el historial.</p>
      {error && <p role="alert" className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
    </Modal>
  );
}

function Panel() {
  const { usuario: yo } = useUsuario();
  const [lista, setLista] = useState<Usuario[] | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [modal, setModal] = useState<null | { tipo: 'nuevo' } | { tipo: 'editar'; u: Usuario } | { tipo: 'password'; u: Usuario } | { tipo: 'eliminar'; u: Usuario }>(null);

  const cargar = useCallback(async () => {
    try { setLista(await api<Usuario[]>('/api/usuarios')); } catch (e) { setError(errorDe(e).msg); }
  }, []);
  useEffect(() => { void cargar(); }, [cargar]);

  const ordenar = (l: Usuario[]) => [...l].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const guardado = (u: Usuario) => setLista((l) => ordenar([...(l ?? []).filter((x) => x.id !== u.id), u]));

  const filtrada = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (lista ?? []).filter((u) => !t || [u.nombre, u.correo, u.departamento, u.puesto].some((x) => x.toLowerCase().includes(t)));
  }, [lista, q]);

  const alternar = async (u: Usuario) => {
    setError('');
    try { guardado(await api<Usuario>(`/api/usuarios/${u.id}`, 'PATCH', { activo: !u.activo })); } catch (e) { setError(errorDe(e).msg); }
  };

  const acciones = (u: Usuario) => (
    <div className="flex flex-wrap gap-1.5 md:justify-end">
      <button onClick={() => setModal({ tipo: 'editar', u })} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11px] font-bold text-[#0F3470] hover:bg-blue-50 cursor-pointer"><Pencil size={13} /> Editar</button>
      <button onClick={() => setModal({ tipo: 'password', u })} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11px] font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"><KeyRound size={13} /> Contraseña</button>
      {u.id !== yo?.id && <button onClick={() => alternar(u)} className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11px] font-bold text-gray-600 hover:bg-gray-50 cursor-pointer">{u.activo ? 'Desactivar' : 'Activar'}</button>}
      {u.id !== yo?.id && <button onClick={() => setModal({ tipo: 'eliminar', u })} aria-label={`Eliminar a ${u.nombre}`} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-[11px] font-bold text-red-600 hover:bg-red-50 cursor-pointer"><Trash2 size={13} /> Eliminar</button>}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5 font-sans">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Usuarios</h1>
          <p className="text-xs text-gray-500 mt-0.5">Registra personas y edita sus datos, rol y acceso cuando lo necesites.</p>
        </div>
        <button onClick={() => setModal({ tipo: 'nuevo' })} className={`${btn} bg-[#0F3470] text-white hover:bg-[#0A2552] shadow-sm w-full sm:w-auto`}><UserPlus size={15} /> Registrar usuario</button>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 text-gray-400 focus-within:ring-2 focus-within:ring-[#0F3470]">
            <Search size={15} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, correo, departamento o puesto…" aria-label="Buscar usuarios" className="w-full py-2.5 text-xs outline-none text-gray-800 bg-transparent" />
          </div>
        </div>
        {error && <p role="alert" className="px-4 py-2 text-[11px] font-semibold text-red-600 bg-red-50">{error}</p>}

        {!lista ? <div className="p-4 space-y-3" role="status" aria-live="polite"><span className="sr-only">Cargando usuarios…</span>{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div> : filtrada.length === 0 ? (
          <p className="py-10 text-center text-xs text-gray-400">No hay usuarios que coincidan.</p>
        ) : (
          <>
            {/* Celular: tarjetas */}
            <ul className="anim-stagger md:hidden divide-y divide-gray-100">
              {filtrada.map((u) => (
                <li key={u.id} className={`p-4 space-y-2 ${u.activo ? '' : 'opacity-60'}`}>
                  <div className="flex items-start gap-3">
                    <span className="w-9 h-9 rounded-full bg-blue-50 text-[#0F3470] text-xs font-bold flex items-center justify-center shrink-0">{iniciales(u.nombre)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800">{u.nombre}</p>
                      <p className="text-[11px] text-gray-500 break-all">{u.correo}</p>
                      <p className="text-[11px] text-gray-400">{u.puesto} · {u.departamento}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5"><Badge tono={u.rol === 'admin' ? 'violet' : 'blue'}>{u.rol === 'admin' ? 'Administrador SGI' : 'Docente'}</Badge><Badge tono={u.activo ? 'green' : 'gray'}>{u.activo ? 'Activo' : 'Desactivado'}</Badge></div>
                  {acciones(u)}
                </li>
              ))}
            </ul>
            {/* Escritorio: tabla */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50/70 text-left text-[10px] uppercase tracking-wider text-gray-400"><th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Correo</th><th className="px-4 py-3">Departamento</th><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3" /></tr></thead>
                <tbody className="anim-stagger divide-y divide-gray-50">
                  {filtrada.map((u) => (
                    <tr key={u.id} className={u.activo ? '' : 'opacity-60'}>
                      <td className="px-4 py-3"><div className="flex items-center gap-2.5"><span className="w-8 h-8 rounded-full bg-blue-50 text-[#0F3470] text-xs font-bold flex items-center justify-center shrink-0">{iniciales(u.nombre)}</span><div><p className="font-bold text-slate-800">{u.nombre}</p><p className="text-[11px] text-gray-400">{u.puesto}</p></div></div></td>
                      <td className="px-4 py-3 text-gray-600">{u.correo}</td>
                      <td className="px-4 py-3 text-gray-600">{u.departamento}</td>
                      <td className="px-4 py-3"><Badge tono={u.rol === 'admin' ? 'violet' : 'blue'}>{u.rol === 'admin' ? 'Administrador SGI' : 'Docente'}</Badge></td>
                      <td className="px-4 py-3"><Badge tono={u.activo ? 'green' : 'gray'}>{u.activo ? 'Activo' : 'Desactivado'}</Badge></td>
                      <td className="px-4 py-3">{acciones(u)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <p className="px-4 py-3 text-[11px] text-gray-400 border-t border-gray-100">{lista?.length ?? 0} usuarios. Si cambias el nombre de alguien, las requisiciones que ya creó conservan el nombre con el que se registraron.</p>
      </section>

      {modal?.tipo === 'nuevo' && <ModalUsuario onClose={() => setModal(null)} onGuardado={guardado} />}
      {modal?.tipo === 'editar' && <ModalUsuario usuario={modal.u} esYo={modal.u.id === yo?.id} onClose={() => setModal(null)} onGuardado={guardado} />}
      {modal?.tipo === 'eliminar' && <ModalEliminar u={modal.u} onClose={() => setModal(null)} onEliminado={() => setLista((l) => (l ?? []).filter((x) => x.id !== modal.u.id))} onDesactivar={() => alternar(modal.u)} />}
      {modal?.tipo === 'password' && <ModalPassword u={modal.u} onClose={() => setModal(null)} />}
    </div>
  );
}

export default function UsuariosPage() {
  return <RequireRole rol="admin"><Panel /></RequireRole>;
}
