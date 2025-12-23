'use client';

import React from 'react';
import { X } from 'lucide-react';

interface InsufficientCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuyCredits: () => void;
}

export function InsufficientCreditsModal({
  isOpen,
  onClose,
  onBuyCredits,
}: InsufficientCreditsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <X size={16} className="text-gray-400" />
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🪙</span>
          </div>

          <h2 className="text-2xl font-black mb-2 uppercase italic">
            Sin Créditos
          </h2>

          <p className="text-gray-400 text-sm mb-6">
            Necesitas créditos para crear Face Swaps. Compra un paquete para continuar.
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onBuyCredits}
              className="px-6 py-4 rounded-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-xl shadow-pink-500/20 hover:shadow-pink-500/30 transition-all active:scale-95"
            >
              Comprar Créditos
            </button>

            <button
              onClick={onClose}
              className="px-6 py-3 rounded-2xl font-medium text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
