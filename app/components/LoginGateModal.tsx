'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Gift, Clock, Download, Zap } from 'lucide-react';

interface LoginGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => Promise<void>;
  resultImage?: string;
}

export function LoginGateModal({ isOpen, onClose, onLogin, resultImage }: LoginGateModalProps) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await onLogin();
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
      <div className="relative max-w-md mx-4 w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl border border-pink-500/30 shadow-2xl shadow-pink-500/20 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-purple-500/10" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="relative p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Sparkles className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-4xl font-black tracking-tighter mb-3 uppercase italic">
            ¡Tu Face Swap<br />
            <span className="text-pink-500">Está Listo!</span>
          </h2>

          {/* Preview thumbnail if available */}
          {resultImage && (
            <div className="relative w-32 h-32 mx-auto mb-6 rounded-2xl overflow-hidden border-2 border-pink-500/50">
              <img src={resultImage} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}

          {/* Urgency timer */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/30 mb-6">
            <Clock size={16} className="text-red-400" />
            <span className="text-red-400 font-bold text-sm">
              Oferta expira en {formatTime(timeLeft)}
            </span>
          </div>

          {/* Value proposition */}
          <p className="text-gray-300 mb-6 text-lg">
            Inicia sesión <span className="font-bold text-white">AHORA</span> y obtén:
          </p>

          {/* Benefits */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20">
              <Gift className="w-6 h-6 text-pink-400 flex-shrink-0" />
              <p className="text-left text-sm">
                <span className="font-bold text-white">10 créditos GRATIS</span>
                <span className="text-gray-400"> (valor $1.40 USD)</span>
              </p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <Download className="w-6 h-6 text-blue-400 flex-shrink-0" />
              <p className="text-left text-sm">
                <span className="font-bold text-white">Descarga</span>
                <span className="text-gray-400"> este resultado en alta calidad</span>
              </p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <Zap className="w-6 h-6 text-yellow-400 flex-shrink-0" />
              <p className="text-left text-sm">
                <span className="font-bold text-white">Crea ilimitados</span>
                <span className="text-gray-400"> Face Swaps con tus créditos</span>
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full h-16 rounded-2xl font-black text-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-xl shadow-pink-500/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-4 uppercase italic"
          >
            {isLoggingIn ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Iniciando...
              </>
            ) : (
              <>
                <Sparkles size={24} />
                Iniciar con Google
              </>
            )}
          </button>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border-2 border-black" />
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-black" />
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-black" />
            </div>
            <span>+10,000 usuarios ya crearon su Face Swap</span>
          </div>

          {/* Fine print */}
          <p className="text-xs text-gray-600 mt-6">
            🔒 Sin tarjeta requerida • Gratis para siempre • Cancela cuando quieras
          </p>
        </div>
      </div>
    </div>
  );
}
