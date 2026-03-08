'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Sparkles, Check } from 'lucide-react';
import { useBrand } from '@/app/contexts/BrandContext';
import { BrandConfig } from '@/types/brand';

interface BrandItem {
  id: string;
  name: string;
  logo: string;
  domain: string;
  updatedAt: string | null;
}

export function BrandSwitcherDropdown() {
  const { brand, setBrand } = useBrand();
  const [open, setOpen] = useState(false);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Fetch brands when dropdown opens for the first time
  useEffect(() => {
    if (open && brands.length === 0) {
      setLoading(true);
      fetch('/api/brands')
        .then((r) => r.json())
        .then((data) => setBrands(data.brands || []))
        .catch(() => setBrands([]))
        .finally(() => setLoading(false));
    }
  }, [open, brands.length]);

  function handleSelect(item: BrandItem) {
    const newBrand: BrandConfig = {
      id: item.id,
      name: item.name,
      logo: item.logo,
      domain: item.domain,
      isActive: true,
      createdAt: new Date(),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
    };
    setBrand(newBrand);
    setOpen(false);
  }

  function getLogoUrl(b: { logo: string; updatedAt: string | null; name: string }) {
    if (!b.logo || !b.logo.startsWith('http')) return null;
    const ts = b.updatedAt ? new Date(b.updatedAt).getTime() : '1';
    return `${b.logo}${b.logo.includes('?') ? '&' : '?'}v=${ts}`;
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 cursor-pointer group"
        aria-label="Cambiar brand"
      >
        {brand.logo && brand.logo.startsWith('http') ? (
          <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center">
            <img
              src={getLogoUrl({ logo: brand.logo, updatedAt: brand.updatedAt ? brand.updatedAt.toISOString() : null, name: brand.name })!}
              alt={brand.name}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-8 h-8 bg-gradient-primary rounded-xl flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        )}
        <span className="font-black text-lg tracking-tighter italic uppercase">
          {brand.name}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-2 min-w-[160px] bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-400">Cargando...</div>
          ) : brands.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">Sin brands</div>
          ) : (
            brands.map((item) => {
              const logoUrl = getLogoUrl({ logo: item.logo, updatedAt: item.updatedAt, name: item.name });
              const isActive = brand.name === item.name;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors ${isActive ? 'text-white' : 'text-gray-300'}`}
                >
                  {logoUrl ? (
                    <div className="w-6 h-6 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={logoUrl} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0">
                      <Sparkles size={10} className="text-white" />
                    </div>
                  )}
                  <span className="font-bold text-sm uppercase tracking-tight flex-1">{item.name}</span>
                  {isActive && <Check size={14} className="text-pink-400 flex-shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
