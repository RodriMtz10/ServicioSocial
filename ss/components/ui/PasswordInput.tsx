'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Clases del <input> (el botón del ojito se coloca encima, a la derecha). */
  claseInput: string;
}

/** Campo de contraseña con botón "ojito" para mostrar u ocultar lo escrito. */
export function PasswordInput({ claseInput, className = '', ...props }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={`relative ${className}`}>
      <input {...props} type={visible ? 'text' : 'password'} autoCapitalize="none" autoCorrect="off" spellCheck={false} className={`${claseInput} pr-11`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-gray-400 hover:text-[#0F3470] focus-visible:text-[#0F3470] focus:outline-none rounded-r-lg cursor-pointer"
      >
        {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
      </button>
    </div>
  );
}

/** Lista en vivo de requisitos de la contraseña (el servidor valida además que no sea común ni contenga el correo). */
export function RequisitosPassword({ password, repetir }: { password: string; repetir?: string }) {
  const reglas: [boolean, string][] = [
    [password.length >= 8, 'Al menos 8 caracteres'],
    [/[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(password) && /\d/.test(password), 'Combina letras y números'],
    ...(repetir !== undefined ? [[password.length > 0 && password === repetir, 'Las dos contraseñas coinciden'] as [boolean, string]] : []),
  ];
  return (
    <ul className="space-y-0.5 text-[11px]" aria-label="Requisitos de la contraseña">
      {reglas.map(([cumple, texto]) => (
        <li key={texto} className={`flex items-center gap-1.5 ${cumple ? 'text-emerald-700' : 'text-gray-400'}`}>
          <span aria-hidden className={`inline-flex w-3.5 h-3.5 rounded-full items-center justify-center text-[9px] font-bold ${cumple ? 'bg-emerald-100' : 'bg-gray-100'}`}>{cumple ? '✓' : '·'}</span>
          <span>{texto}<span className="sr-only">{cumple ? ' (cumple)' : ' (pendiente)'}</span></span>
        </li>
      ))}
    </ul>
  );
}
