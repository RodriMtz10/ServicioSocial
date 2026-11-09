'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { LogoTecnm } from '@/components/ui/Logo';
import { EtiquetaCarga } from '@/components/ui/Cargando';
import BotonTema from '@/components/ui/BotonTema';
import { PasswordInput, RequisitosPassword } from '@/components/ui/PasswordInput';
import { SelectDepartamento, SelectPuesto } from '@/components/ui/ListasInstitucionales';
import { api, ApiError } from '@/lib/api';

const campo = 'w-full px-3 py-3 sm:py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-[#0F3470] focus:outline-none text-gray-800 bg-white';
const etiqueta = 'block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1';
const boton = 'w-full py-3 px-4 bg-[#0F3470] hover:bg-[#0A2552] disabled:opacity-60 text-white font-semibold rounded-lg text-sm shadow transition-colors cursor-pointer';

interface InfoRegistro { abierto: boolean; dominios: string[] }
const ESPERA_REENVIO = 60;

function Acceso() {
  const params = useSearchParams();
  const [modo, setModo] = useState<'login' | 'registro' | 'recuperar'>('login');
  const [paso, setPaso] = useState<1 | 2>(1);
  const [info, setInfo] = useState<InfoRegistro | null>(null);
  const [f, setF] = useState({ correo: '', codigo: '', nombre: '', departamento: '', puesto: '', password: '', repetir: '' });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [cargando, setCargando] = useState(false);
  const [espera, setEspera] = useState(0);
  const codigoRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => { api<InfoRegistro>('/api/registro').then(setInfo).catch(() => setInfo(null)); }, []);
  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera((e) => e - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);
  useEffect(() => { if (paso === 2) codigoRef.current?.focus(); }, [paso]);

  const entrar = async (correo: string, password: string) => {
    const res = await signIn('credentials', { email: correo, password, redirect: false });
    if (!res || res.error) return false;
    // Navegación completa para que el proxy y el layout lean la sesión nueva.
    window.location.href = params.get('callbackUrl') || '/dashboard/tablero';
    return true;
  };

  const iniciar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setCargando(true);
    const ok = await entrar(f.correo, f.password);
    setCargando(false);
    if (!ok) setError('Correo o contraseña incorrectos.');
  };

  const pedirCodigo = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(''); setErrores({}); setAviso(''); setCargando(true);
    try {
      await api(modo === 'recuperar' ? '/api/recuperacion/codigo' : '/api/registro/codigo', 'POST', { correo: f.correo });
      setPaso(2); setEspera(ESPERA_REENVIO);
      setAviso(modo === 'recuperar'
        ? `Si existe una cuenta con ${f.correo.trim().toLowerCase()}, te enviamos un código de 6 dígitos. Revisa también tu carpeta de spam.`
        : `Te enviamos un código de 6 dígitos a ${f.correo.trim().toLowerCase()}. Revisa también tu carpeta de spam.`);
    } catch (err) {
      if (err instanceof ApiError) { setError(err.message); setErrores(err.errores ?? {}); } else setError('Ocurrió un error inesperado.');
    } finally { setCargando(false); }
  };

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setErrores({}); setAviso('');
    if (f.password !== f.repetir) { setErrores({ repetir: 'Las contraseñas no coinciden' }); return; }
    setCargando(true);
    try {
      await api('/api/registro', 'POST', { correo: f.correo, codigo: f.codigo, nombre: f.nombre, departamento: f.departamento, puesto: f.puesto, password: f.password });
      if (!(await entrar(f.correo, f.password))) { setModo('login'); setError('Cuenta creada. Inicia sesión con tu correo y contraseña.'); }
    } catch (err) {
      if (err instanceof ApiError) { setError(err.message); setErrores(err.errores ?? {}); } else setError('Ocurrió un error inesperado.');
    } finally { setCargando(false); }
  };

  const recuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setErrores({}); setAviso('');
    if (f.password !== f.repetir) { setErrores({ repetir: 'Las contraseñas no coinciden' }); return; }
    setCargando(true);
    try {
      await api('/api/recuperacion', 'POST', { correo: f.correo, codigo: f.codigo, password: f.password });
      setModo('login'); setPaso(1); setF((p) => ({ ...p, codigo: '', password: '', repetir: '' }));
      setAviso('Contraseña actualizada. Ya puedes iniciar sesión con tu nueva contraseña.');
    } catch (err) {
      if (err instanceof ApiError) { setError(err.message); setErrores(err.errores ?? {}); } else setError('Ocurrió un error inesperado.');
    } finally { setCargando(false); }
  };

  const registroPosible = info?.abierto === true;
  const cambiar = (m: 'login' | 'registro' | 'recuperar') => { setModo(m); setPaso(1); setError(''); setErrores({}); setAviso(''); };
  const borde = (k: string) => (errores[k] ? 'border-red-400 bg-red-50/40' : 'border-gray-300');
  const Err = ({ k }: { k: string }) => (errores[k] ? <p className="text-[11px] font-semibold text-red-600 mt-1">{errores[k]}</p> : null);

  return (
    <div className="relative min-h-screen bg-[#F3F6FA] flex flex-col justify-center py-8 px-4 sm:py-12 sm:px-6 lg:px-8 font-sans">
      <BotonTema className="absolute top-3 right-3 sm:top-4 sm:right-4" />
      <div className="anim-fade-up sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white p-6 rounded-t-2xl shadow-lg border border-b-0 border-gray-100 flex flex-col items-center gap-3">
          <LogoTecnm className="h-16" />
          <p className="text-xs text-[#0F3470] font-semibold">Instituto Tecnológico de Morelia • Portal SGI</p>
        </div>
        <div className="h-1.5 bg-[#0F3470]" />

        <div className="bg-white py-8 px-6 shadow-xl rounded-b-2xl border border-t-0 border-gray-100">
          <div className="mb-6 text-center">
            <h1 className="text-lg font-bold text-gray-800">{modo === 'login' ? 'Acceso al Sistema de Acciones Correctivas' : modo === 'recuperar' ? (paso === 1 ? 'Recuperar contraseña' : 'Crea tu nueva contraseña') : paso === 1 ? 'Crear cuenta' : 'Verifica tu correo y completa tus datos'}</h1>
            <p className="text-xs text-gray-500 mt-1">
              {modo === 'login' ? 'Ingresa tus credenciales institucionales' : modo === 'recuperar' ? (paso === 1 ? 'Escribe tu correo institucional y te enviaremos un código' : 'Escribe el código que te llegó y elige una contraseña nueva') : paso === 1 ? 'Escribe tu correo institucional y te enviaremos un código' : 'Escribe el código que te llegó y elige tus datos'}
            </p>
          </div>

          {error && <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">{error}</div>}
          {aviso && <div role="status" className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">{aviso}</div>}

          <div key={`${modo}-${paso}`} className="anim-fade-up">
          {modo === 'login' ? (
            <form onSubmit={iniciar} className="space-y-4">
              <div>
                <label htmlFor="email" className={etiqueta}>Correo institucional</label>
                <input id="email" type="email" required autoComplete="username" inputMode="email" value={f.correo} onChange={(e) => set('correo', e.target.value)} placeholder="usuario@morelia.tecnm.mx" className={`${campo} border-gray-300`} />
              </div>
              <div>
                <label htmlFor="password" className={etiqueta}>Contraseña</label>
                <PasswordInput id="password" required autoComplete="current-password" value={f.password} onChange={(e) => set('password', e.target.value)} placeholder="••••••••" claseInput={`${campo} border-gray-300`} />
              </div>
              <div className="text-right -mt-1"><button type="button" onClick={() => cambiar('recuperar')} className="text-xs font-semibold text-[#0F3470] hover:underline cursor-pointer">¿Olvidaste tu contraseña?</button></div>
              <button type="submit" disabled={cargando} className={boton}><EtiquetaCarga cargando={cargando} enCurso="Entrando…">Iniciar sesión</EtiquetaCarga></button>
            </form>
          ) : modo === 'recuperar' ? (
            paso === 1 ? (
              <form onSubmit={pedirCodigo} className="space-y-4">
                <div>
                  <label htmlFor="rec-correo" className={etiqueta}>Correo institucional</label>
                  <input id="rec-correo" type="email" required autoFocus autoComplete="username" inputMode="email" value={f.correo} onChange={(e) => set('correo', e.target.value)} placeholder="usuario@morelia.tecnm.mx" className={`${campo} ${borde('correo')}`} /><Err k="correo" />
                </div>
                <button type="submit" disabled={cargando} className={boton}><EtiquetaCarga cargando={cargando} enCurso="Enviando…">Enviar código a mi correo</EtiquetaCarga></button>
              </form>
            ) : (
              <form onSubmit={recuperar} className="space-y-4">
                <div className="flex items-center justify-between gap-2 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <span className="truncate text-gray-700 font-medium">{f.correo.trim().toLowerCase()}</span>
                  <button type="button" onClick={() => { setPaso(1); setAviso(''); setError(''); }} className="shrink-0 font-bold text-[#0F3470] hover:underline cursor-pointer">Cambiar</button>
                </div>
                <div>
                  <label htmlFor="rec-codigo" className={etiqueta}>Código de 6 dígitos</label>
                  <input id="rec-codigo" ref={codigoRef} required inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" value={f.codigo} onChange={(e) => set('codigo', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className={`${campo} ${borde('codigo')} text-center text-xl font-mono tracking-[0.5em]`} /><Err k="codigo" />
                  <p className="text-[11px] text-gray-500 mt-1.5">
                    ¿No te llegó?{' '}
                    <button type="button" disabled={espera > 0 || cargando} onClick={() => pedirCodigo()} className="font-bold text-[#0F3470] hover:underline disabled:text-gray-400 disabled:no-underline cursor-pointer disabled:cursor-not-allowed">
                      {espera > 0 ? `Reenviar en ${espera} s` : 'Reenviar código'}
                    </button>
                  </p>
                </div>
                <div>
                  <label htmlFor="rec-pass" className={etiqueta}>Nueva contraseña</label>
                  <PasswordInput id="rec-pass" required minLength={8} maxLength={72} autoComplete="new-password" value={f.password} onChange={(e) => set('password', e.target.value)} claseInput={`${campo} ${borde('password')}`} /><Err k="password" />
                </div>
                <div>
                  <label htmlFor="rec-pass2" className={etiqueta}>Repite la nueva contraseña</label>
                  <PasswordInput id="rec-pass2" required maxLength={72} autoComplete="new-password" value={f.repetir} onChange={(e) => set('repetir', e.target.value)} claseInput={`${campo} ${borde('repetir')}`} /><Err k="repetir" />
                  <div className="mt-2"><RequisitosPassword password={f.password} repetir={f.repetir} /></div>
                </div>
                <button type="submit" disabled={cargando} className={boton}><EtiquetaCarga cargando={cargando} enCurso="Guardando…">Cambiar contraseña</EtiquetaCarga></button>
              </form>
            )
          ) : paso === 1 ? (
            <form onSubmit={pedirCodigo} className="space-y-4">
              <div>
                <label htmlFor="r-correo" className={etiqueta}>Correo institucional</label>
                <input id="r-correo" type="email" required autoFocus autoComplete="username" inputMode="email" value={f.correo} onChange={(e) => set('correo', e.target.value)} placeholder={info?.dominios.length ? `usuario@${info.dominios[0]}` : 'usuario@morelia.tecnm.mx'} className={`${campo} ${borde('correo')}`} /><Err k="correo" />
                {info?.dominios.length ? <p className="text-[11px] text-gray-400 mt-1">Solo se aceptan correos {info.dominios.map((d) => '@' + d).join(', ')}.</p> : null}
              </div>
              <button type="submit" disabled={cargando} className={boton}><EtiquetaCarga cargando={cargando} enCurso="Enviando…">Enviar código a mi correo</EtiquetaCarga></button>
            </form>
          ) : (
            <form onSubmit={registrar} className="space-y-4">
              <div className="flex items-center justify-between gap-2 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <span className="truncate text-gray-700 font-medium">{f.correo.trim().toLowerCase()}</span>
                <button type="button" onClick={() => { setPaso(1); setAviso(''); setError(''); }} className="shrink-0 font-bold text-[#0F3470] hover:underline cursor-pointer">Cambiar</button>
              </div>
              <div>
                <label htmlFor="r-codigo" className={etiqueta}>Código de 6 dígitos</label>
                <input id="r-codigo" ref={codigoRef} required inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" value={f.codigo} onChange={(e) => set('codigo', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className={`${campo} ${borde('codigo')} text-center text-xl font-mono tracking-[0.5em]`} /><Err k="codigo" />
                <p className="text-[11px] text-gray-500 mt-1.5">
                  ¿No te llegó?{' '}
                  <button type="button" disabled={espera > 0 || cargando} onClick={() => pedirCodigo()} className="font-bold text-[#0F3470] hover:underline disabled:text-gray-400 disabled:no-underline cursor-pointer disabled:cursor-not-allowed">
                    {espera > 0 ? `Reenviar en ${espera} s` : 'Reenviar código'}
                  </button>
                </p>
              </div>
              <div>
                <label htmlFor="r-nombre" className={etiqueta}>Nombre completo</label>
                <input id="r-nombre" required autoComplete="name" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} className={`${campo} ${borde('nombre')}`} /><Err k="nombre" />
              </div>
              <div>
                <label htmlFor="r-depto" className={etiqueta}>Departamento o carrera</label>
                <SelectDepartamento id="r-depto" required value={f.departamento} onChange={(v) => set('departamento', v)} clase={`${campo} ${borde('departamento')}`} /><Err k="departamento" />
              </div>
              <div>
                <label htmlFor="r-puesto" className={etiqueta}>Puesto</label>
                <SelectPuesto id="r-puesto" required value={f.puesto} onChange={(v) => set('puesto', v)} clase={`${campo} ${borde('puesto')}`} /><Err k="puesto" />
              </div>
              <div>
                <label htmlFor="r-pass" className={etiqueta}>Crea tu contraseña</label>
                <PasswordInput id="r-pass" required minLength={8} maxLength={72} autoComplete="new-password" value={f.password} onChange={(e) => set('password', e.target.value)} claseInput={`${campo} ${borde('password')}`} /><Err k="password" />
              </div>
              <div>
                <label htmlFor="r-pass2" className={etiqueta}>Repite la contraseña</label>
                <PasswordInput id="r-pass2" required maxLength={72} autoComplete="new-password" value={f.repetir} onChange={(e) => set('repetir', e.target.value)} claseInput={`${campo} ${borde('repetir')}`} /><Err k="repetir" />
                <div className="mt-2"><RequisitosPassword password={f.password} repetir={f.repetir} /></div>
              </div>
              <button type="submit" disabled={cargando} className={boton}><EtiquetaCarga cargando={cargando} enCurso="Creando cuenta…">Crear cuenta</EtiquetaCarga></button>
            </form>
          )}

          </div>

          {modo === 'recuperar' && (
            <p className="mt-6 text-center text-xs text-gray-500">¿Ya la recordaste? <button type="button" onClick={() => cambiar('login')} className="font-bold text-[#0F3470] hover:underline cursor-pointer">Volver a iniciar sesión</button></p>
          )}
          {registroPosible && modo !== 'recuperar' && (
            <p className="mt-6 text-center text-xs text-gray-500">
              {modo === 'login' ? (
                <>¿Aún no tienes cuenta? <button type="button" onClick={() => cambiar('registro')} className="font-bold text-[#0F3470] hover:underline cursor-pointer">Regístrate</button></>
              ) : (
                <>¿Ya tienes cuenta? <button type="button" onClick={() => cambiar('login')} className="font-bold text-[#0F3470] hover:underline cursor-pointer">Inicia sesión</button></>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  // useSearchParams requiere Suspense en el App Router.
  return (
    <Suspense fallback={null}>
      <Acceso />
    </Suspense>
  );
}
