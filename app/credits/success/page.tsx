'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../auth/AuthProvider';
import { CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getUserIdToken } = useAuth();

  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Cargar nuevo balance de créditos
    loadCredits();

    // Auto-redirect después de 5 segundos
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadCredits = async () => {
    try {
      const token = await getUserIdToken();
      const response = await fetch('/api/credits/balance', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
      }
    } catch (error) {
      console.error('Error cargando créditos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Success icon */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 flex items-center justify-center mx-auto mb-6 animate-bounce">
          <CheckCircle2 size={48} className="text-green-500" />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-black mb-4 uppercase italic">
          ¡Pago <span className="text-pink-600">Exitoso!</span>
        </h1>

        {/* Credits info */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 mb-6">
            <RefreshCw size={20} className="animate-spin text-gray-400" />
            <p className="text-gray-400">Cargando créditos...</p>
          </div>
        ) : (
          <div className="mb-6">
            <p className="text-gray-400 mb-3">Ahora tienes</p>
            <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-600/20 to-purple-600/20 border border-pink-500/30">
              <span className="text-4xl">🪙</span>
              <span className="text-4xl font-black">{credits}</span>
              <span className="text-lg text-gray-400">créditos</span>
            </div>
          </div>
        )}

        {/* Description */}
        <p className="text-gray-500 mb-8">
          ¡Gracias por tu compra! Tus créditos ya están disponibles para usar.
        </p>

        {/* Button */}
        <button
          onClick={() => router.push('/')}
          className="w-full px-6 py-4 rounded-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-xl shadow-pink-500/20 hover:shadow-pink-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Sparkles size={20} />
          Empezar a Crear
        </button>

        {/* Countdown */}
        <p className="text-sm text-gray-500 mt-4">
          Redirigiendo en {countdown} segundos...
        </p>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce {
          animation: bounce 1s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] text-white font-sans flex items-center justify-center">
        <RefreshCw size={40} className="animate-spin text-pink-600" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
