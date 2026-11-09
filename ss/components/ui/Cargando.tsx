import React from 'react';

/** Rueda giratoria pequeña (botones y avisos de carga). */
export function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Bloque gris con brillo en movimiento que anticipa dónde aparecerá el contenido. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} aria-hidden="true" />;
}

/** Pantalla de carga con la forma de una página del panel (título, tarjetas y lista). */
export function PaginaCargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="max-w-7xl mx-auto space-y-5 anim-fade" role="status" aria-live="polite">
      <span className="sr-only">{texto}</span>
      <div className="space-y-2"><Skeleton className="h-6 w-56" /><Skeleton className="h-3 w-80 max-w-full" /></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[68px] rounded-2xl" />)}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <Skeleton className="h-9 w-full sm:w-72" />
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    </div>
  );
}

/** Etiqueta de botón: muestra la rueda y el texto "en curso" mientras `cargando` es verdadero. */
export function EtiquetaCarga({ cargando, enCurso, children }: { cargando: boolean; enCurso: string; children: React.ReactNode }) {
  return cargando ? <span className="inline-flex items-center justify-center gap-2"><Spinner />{enCurso}</span> : <>{children}</>;
}
