'use client';

import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

interface CreditPackage {
  packageId: string;
  name: string;
  credits: number;
  priceUSD: number; // En centavos
  description: string;
  popular: boolean;
}

interface CreditPackageCardProps {
  package: CreditPackage;
  onSelect: (packageId: string) => void;
  loading?: boolean;
}

export function CreditPackageCard({
  package: pkg,
  onSelect,
  loading = false,
}: CreditPackageCardProps) {
  const priceInDollars = (pkg.priceUSD / 100).toFixed(2);
  const pricePerCredit = (pkg.priceUSD / 100 / pkg.credits).toFixed(2);

  return (
    <div
      className={`relative rounded-3xl p-6 border transition-all ${
        pkg.popular
          ? 'bg-gradient-to-b from-pink-600/10 to-purple-600/10 border-pink-500/50 scale-105'
          : 'bg-white/5 border-white/10 hover:border-white/20'
      }`}
    >
      {/* Popular badge */}
      {pkg.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-xs font-black uppercase tracking-wider">
          Popular
        </div>
      )}

      {/* Content */}
      <div className="text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🪙</span>
        </div>

        {/* Name */}
        <h3 className="text-xl font-black uppercase italic mb-1">{pkg.name}</h3>

        {/* Credits */}
        <p className="text-4xl font-black mb-2">
          {pkg.credits} <span className="text-base text-gray-400">créditos</span>
        </p>

        {/* Price */}
        <p className="text-3xl font-bold mb-1">${priceInDollars}</p>

        {/* Price per credit */}
        <p className="text-xs text-gray-500 mb-4">
          ${pricePerCredit} por crédito
        </p>

        {/* Description */}
        <p className="text-sm text-gray-400 mb-6">{pkg.description}</p>

        {/* Button */}
        <button
          onClick={() => onSelect(pkg.packageId)}
          disabled={loading}
          className={`w-full px-6 py-4 rounded-2xl font-bold transition-all ${
            pkg.popular
              ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-xl shadow-pink-500/20 hover:shadow-pink-500/30'
              : 'bg-white/10 text-white hover:bg-white/20'
          } active:scale-95 flex items-center justify-center gap-2 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Comprar
            </>
          )}
        </button>
      </div>
    </div>
  );
}
