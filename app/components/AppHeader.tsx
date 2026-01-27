'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Sparkles, Image, Menu, LogIn, RefreshCw } from 'lucide-react';
import { CreditsDisplay } from './CreditsDisplay';
import { ThemeSelector } from './ThemeSelector';
import { useBrand } from '@/app/contexts/BrandContext';

interface AppHeaderProps {
  isGuestMode?: boolean;
  userCredits?: number;
  loadingCredits?: boolean;
  isSigningIn?: boolean;
  onSignIn?: () => void;
  onMenuClick: () => void;
  onLogoClick?: () => void;
}

export function AppHeader({
  isGuestMode = false,
  userCredits = 0,
  loadingCredits = false,
  isSigningIn = false,
  onSignIn,
  onMenuClick,
  onLogoClick,
}: AppHeaderProps) {
  const router = useRouter();
  const t = useTranslations();
  const { brand } = useBrand();

  return (
    <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-14 bg-theme-bg-secondary/70 backdrop-blur-2xl border-b border-theme z-50 flex items-center justify-between px-4">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={onLogoClick || (() => router.push('/'))}
      >
        {brand.logo && brand.logo.startsWith('http') ? (
          // Custom logo from Firebase Storage
          <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center">
            <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" />
          </div>
        ) : (
          // Default gradient icon
          <div className="w-8 h-8 bg-gradient-primary rounded-xl flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        )}
        <span className="font-black text-lg tracking-tighter italic uppercase">{brand.name}</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme Selector */}
        <ThemeSelector />

        {/* Botón de Galería Pública */}
        <button
          onClick={() => router.push('/gallery')}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-pink-500 transition-colors"
          aria-label={t('gallery.title')}
        >
          <Image size={16} />
        </button>

        {isGuestMode ? (
          // Guest mode - solo botón de login y menu
          <>
            <button
              onClick={onSignIn}
              disabled={isSigningIn}
              className="px-3 py-1.5 rounded-full bg-gradient-primary text-white text-sm font-bold active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSigningIn ? (
                <RefreshCw className="animate-spin" size={14} />
              ) : (
                <>
                  <LogIn size={14} />
                  <span>{t('common.enter')}</span>
                </>
              )}
            </button>
            <button
              onClick={onMenuClick}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              aria-label="Menú"
            >
              <Menu size={18} />
            </button>
          </>
        ) : (
          // Usuario autenticado - mostrar créditos y menú
          <>
            <CreditsDisplay credits={userCredits} loading={loadingCredits} />
            <button
              onClick={onMenuClick}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              aria-label="Menú"
            >
              <Menu size={18} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
