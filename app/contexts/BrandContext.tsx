'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { BrandConfig, DEFAULT_BRAND } from '@/types/brand';

interface BrandContextType {
  brand: BrandConfig;
}

const BrandContext = createContext<BrandContextType>({
  brand: DEFAULT_BRAND,
});

interface BrandProviderProps {
  children: ReactNode;
  brandConfig: BrandConfig;
}

export function BrandProvider({ children, brandConfig }: BrandProviderProps) {
  return (
    <BrandContext.Provider value={{ brand: brandConfig }}>
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
