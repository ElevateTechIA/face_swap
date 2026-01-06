'use client';
// Force dynamic rendering
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth/AuthProvider';
import { CreditPackageCard } from '@/app/components/CreditPackageCard';
import { RefreshCw, ArrowLeft, Receipt } from 'lucide-react';
import { getStripe } from '@/lib/stripe/client';

interface CreditPackage {
  packageId: string;
  name: string;
  credits: number;
  priceUSD: number;
  description: string;
  popular: boolean;
}

export default function CreditsPage() {
  const router = useRouter();
  const { user, getUserIdToken } = useAuth();

  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [currentCredits, setCurrentCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingPackage, setProcessingPackage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar paquetes y balance en paralelo
      const [packagesRes, balanceRes] = await Promise.all([
        fetch('/api/credits/packages'),
        fetch('/api/credits/balance', {
          headers: {
            Authorization: `Bearer ${await getUserIdToken()}`,
          },
        }),
      ]);

      if (packagesRes.ok) {
        const data = await packagesRes.json();
        setPackages(data.packages || []);
      }

      if (balanceRes.ok) {
        const data = await balanceRes.json();
        setCurrentCredits(data.credits || 0);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPackage = async (packageId: string) => {
    try {
      setProcessingPackage(packageId);

      const token = await getUserIdToken();

      // Crear sesión de checkout
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packageId }),
      });

      if (!response.ok) {
        throw new Error('Error creando sesión de checkout');
      }

      const { url } = await response.json();

      // Redirigir a Stripe Checkout
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      console.error('Error en compra:', error);
      alert('Error al procesar la compra. Intenta de nuevo.');
      setProcessingPackage(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <RefreshCw className="w-12 h-12 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      <div className="max-w-md mx-auto px-6 py-12">
        {/* Header */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          Volver
        </button>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-black tracking-tighter mb-4 uppercase italic">
            Comprar <span className="text-pink-600">Créditos</span>
          </h1>
          <p className="text-gray-400 text-lg mb-6">
            Elige el paquete perfecto para ti
          </p>

          {/* Current balance */}
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-pink-600/20 to-purple-600/20 border border-pink-500/30 mb-4">
            <span className="text-2xl">🪙</span>
            <span className="text-lg">
              Tienes <span className="font-bold">{currentCredits}</span> créditos
            </span>
          </div>

          {/* Transactions link */}
          <div>
            <button
              onClick={() => router.push('/transactions')}
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <Receipt size={16} />
              Ver historial de transacciones
            </button>
          </div>
        </div>

        {/* Packages grid */}
        {packages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p>No hay paquetes disponibles en este momento.</p>
            <p className="text-sm mt-2">Por favor, intenta más tarde.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {packages.map((pkg) => (
              <CreditPackageCard
                key={pkg.packageId}
                package={pkg}
                onSelect={handleBuyPackage}
                loading={processingPackage === pkg.packageId}
              />
            ))}
          </div>
        )}

        {/* Footer note */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <p>Pagos procesados de forma segura por Stripe</p>
          <p className="mt-1">Los créditos no caducan y puedes usarlos en cualquier momento</p>
        </div>
      </div>
    </div>
  );
}
