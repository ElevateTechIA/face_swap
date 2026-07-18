'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrandConfig, DEFAULT_BRAND } from '@/types/brand';

const STORAGE_KEY = 'selectedBrand';

interface BrandContextType {
  brand: BrandConfig;
  setBrand: (brand: BrandConfig) => void;
}

const BrandContext = createContext<BrandContextType>({
  brand: DEFAULT_BRAND,
  setBrand: () => {},
});

interface BrandProviderProps {
  children: ReactNode;
  brandConfig: BrandConfig;
}

function getInitialBrand(serverBrand: BrandConfig): BrandConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as BrandConfig;
      // Restore Date objects lost in JSON serialization
      parsed.createdAt = new Date(parsed.createdAt);
      parsed.updatedAt = new Date(parsed.updatedAt);
      return parsed;
    }
  } catch {
    // ignore
  }
  return serverBrand;
}

export function BrandProvider({ children, brandConfig }: BrandProviderProps) {
  const [brand, setBrandState] = useState<BrandConfig>(brandConfig);

  // On mount, override with localStorage if the user previously selected a brand
  useEffect(() => {
    const override = getInitialBrand(brandConfig);
    if (override.name !== brandConfig.name) {
      setBrandState(override);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setBrand(newBrand: BrandConfig) {
    setBrandState(newBrand);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newBrand));
    } catch {
      // ignore
    }
  }

  return (
    <BrandContext.Provider value={{ brand, setBrand }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}
