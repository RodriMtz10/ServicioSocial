/* eslint-disable @next/next/no-img-element */
/** Logotipo oficial del Tecnológico Nacional de México (archivos en /public). */
export function LogoTecnm({ blanco = false, className = 'h-12' }: { blanco?: boolean; className?: string }) {
  return <img src={blanco ? '/logo-tecnm-blanco.png' : '/logo-tecnm.png'} alt="Tecnológico Nacional de México" className={`w-auto ${className}`} />;
}

/** Sello del Instituto Tecnológico de Morelia. */
export function LogoItm({ className = 'h-14' }: { className?: string }) {
  return <img src="/logo-itm.png" alt="Instituto Tecnológico de Morelia" className={`w-auto ${className}`} />;
}
