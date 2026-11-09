import React from 'react';
import { DEPARTAMENTOS, DEPARTAMENTOS_ACADEMICOS, DEPARTAMENTOS_ADMINISTRATIVOS, PUESTOS } from '@/lib/institucional';

type Props = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> & { value: string; onChange: (v: string) => void; clase: string };

/** Valor guardado que ya no está en la lista oficial: se muestra para no perderlo, pero se invita a elegir uno de la lista. */
const Legado = ({ valor, lista }: { valor: string; lista: readonly string[] }) =>
  valor && !lista.includes(valor) ? <option value={valor}>{valor} (cámbialo por uno de la lista)</option> : null;

export function SelectDepartamento({ value, onChange, clase, ...rest }: Props) {
  return (
    <select {...rest} value={value} onChange={(e) => onChange(e.target.value)} className={clase}>
      <option value="">Selecciona tu departamento…</option>
      <Legado valor={value} lista={DEPARTAMENTOS} />
      <optgroup label="Carreras y departamentos académicos">{DEPARTAMENTOS_ACADEMICOS.map((d) => <option key={d} value={d}>{d}</option>)}</optgroup>
      <optgroup label="Áreas administrativas">{DEPARTAMENTOS_ADMINISTRATIVOS.map((d) => <option key={d} value={d}>{d}</option>)}</optgroup>
    </select>
  );
}

export function SelectPuesto({ value, onChange, clase, ...rest }: Props) {
  return (
    <select {...rest} value={value} onChange={(e) => onChange(e.target.value)} className={clase}>
      <option value="">Selecciona tu puesto…</option>
      <Legado valor={value} lista={PUESTOS} />
      {PUESTOS.map((p) => <option key={p} value={p}>{p}</option>)}
    </select>
  );
}

/** Lista desplegable cerrada genérica (conserva un valor previo que ya no esté en la lista para no perderlo). */
export function SelectCerrado({ value, onChange, opciones, placeholder, clase, ...rest }: Props & { opciones: readonly string[]; placeholder: string }) {
  const unicas = [...new Set(opciones)].sort((a, b) => a.localeCompare(b, 'es'));
  return (
    <select {...rest} value={value} onChange={(e) => onChange(e.target.value)} className={clase}>
      <option value="">{placeholder}</option>
      <Legado valor={value} lista={unicas} />
      {unicas.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
