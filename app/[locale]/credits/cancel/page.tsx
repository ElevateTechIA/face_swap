'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function CancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Cancel icon */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-700/20 to-gray-800/20 border-2 border-gray-600/50 flex items-center justify-center mx-auto mb-6">
          <XCircle size={48} className="text-gray-500" />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-black mb-4 uppercase italic">
          Pago <span className="text-gray-500">Cancelado</span>
        </h1>

        {/* Description */}
        <p className="text-gray-400 mb-8">
          No se realizó ningún cargo. Puedes intentar de nuevo cuando quieras.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/credits')}
            className="w-full px-6 py-4 rounded-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-xl shadow-pink-500/20 hover:shadow-pink-500/30 transition-all active:scale-95"
          >
            Volver a Intentar
          </button>

          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-2xl font-medium text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
