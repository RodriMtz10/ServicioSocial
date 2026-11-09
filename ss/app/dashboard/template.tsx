import React from 'react';

/** A diferencia del layout, el template se vuelve a montar en cada navegación: así cada pantalla aparece con una entrada suave. */
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className="anim-fade-up">{children}</div>;
}
