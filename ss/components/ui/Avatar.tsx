'use client';

import React, { useState } from 'react';

const iniciales = (nombre: string) => nombre.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase();

/** Foto de perfil redonda; si no hay foto (o no carga) muestra las iniciales. */
export default function Avatar({ nombre, foto, clase = 'w-8 h-8 text-xs', colores = 'bg-[#0F3470] text-amber-400' }: { nombre: string; foto?: string | null; clase?: string; colores?: string }) {
  const [fallo, setFallo] = useState<string | null>(null);
  const mostrar = !!foto && fallo !== foto;
  return (
    <span className={`${clase} ${colores} rounded-full font-bold flex items-center justify-center shrink-0 overflow-hidden shadow-xs`}>
      {mostrar
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={foto!} alt="" className="w-full h-full object-cover" onError={() => setFallo(foto!)} />
        : iniciales(nombre)}
    </span>
  );
}
