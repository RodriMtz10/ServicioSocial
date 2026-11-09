'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/** Barra fina arriba que se desliza cada vez que cambias de pantalla. */
export default function BarraNavegacion() {
  const ruta = usePathname();
  const anterior = useRef(ruta);
  const [clave, setClave] = useState(0);
  useEffect(() => {
    if (anterior.current !== ruta) { anterior.current = ruta; setClave((k) => k + 1); }
  }, [ruta]);
  if (clave === 0) return null;
  return <div key={clave} aria-hidden="true" className="route-bar fixed top-0 left-0 z-[90] h-0.5 bg-gradient-to-r from-[#0F3470] via-blue-500 to-amber-400 rounded-r-full" />;
}
