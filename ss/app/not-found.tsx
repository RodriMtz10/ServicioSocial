// app/not-found.tsx
import React from 'react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F3F6FA] flex flex-col justify-center items-center p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
        <div className="w-16 h-16 bg-blue-50 text-[#0F3470] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Página No Encontrada</h1>
        <p className="text-xs text-gray-500 mb-6">
          La ruta que intentas visitar no existe o fue movida dentro del sistema SGI.
        </p>
        
        <a 
          href="/dashboard/tablero" 
          className="inline-flex items-center justify-center w-full py-3 px-6 bg-[#0F3470] hover:bg-[#0A2552] text-white font-medium rounded-xl text-sm transition-all shadow-md cursor-pointer"
        >
          ← Ir al Tablero Principal
        </a>
      </div>
    </div>
  );
}