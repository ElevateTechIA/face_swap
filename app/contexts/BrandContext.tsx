'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { BrandConfig, DEFAULT_BRAND } from '@/types/brand';

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

export function BrandProvider({ children, brandConfig }: BrandProviderProps) {
  const [brand, setBrand] = useState<BrandConfig>(brandConfig);

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
