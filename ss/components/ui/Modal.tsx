'use client';
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  titulo: string;
  onClose: () => void;
  children: React.ReactNode;
  pie: React.ReactNode;
}

export default function Modal({ titulo, onClose, children, pie }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="anim-fade fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={titulo} className="anim-pop bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-slate-900">{titulo}</h3>
          <button onClick={onClose} aria-label="Cerrar" className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
        <div className="px-5 pb-4 flex flex-wrap justify-end gap-2">{pie}</div>
      </div>
    </div>
  );
}
