'use client';

import React from 'react';
import { X, History, Share2, LogOut, User, Globe, Image, Palette } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/app/contexts/ThemeContext';
import { themes } from '@/lib/themes/theme-config';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSignOut: () => void;
  onShareApp: () => void;
  currentLocale: string;
  onChangeLocale: (locale: string) => void;
}

export function MobileMenu({
  isOpen,
  onClose,
  user,
  onSignOut,
  onShareApp,
  currentLocale,
  onChangeLocale,
}: MobileMenuProps) {
  const router = useRouter();
  const t = useTranslations();
  const { themeId, setTheme } = useTheme();

  if (!isOpen) return null;

  const menuItems = [
    {
      icon: Image,
      label: t('gallery.title') || 'Galería Pública',
      onClick: () => {
        router.push(`/${currentLocale}/gallery`);
        onClose();
      },
      show: true,
    },
    {
      icon: History,
      label: t('history.title') || 'Historial',
      onClick: () => {
        router.push(`/${currentLocale}/history`);
        onClose();
      },
      show: !!user,
    },
    {
      icon: Share2,
      label: t('share.shareApp') || 'Compartir App',
      onClick: () => {
        onShareApp();
        onClose();
      },
      show: true,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="absolute top-0 right-0 w-72 sm:w-80 h-full bg-gradient-to-b from-gray-900 to-black border-l border-white/10 p-5 sm:p-6 flex flex-col shadow-2xl animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del menú */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-black italic uppercase">Menu</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors touch-manipulation"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Usuario info */}
        {user && (
          <div className="flex items-center gap-3 mb-5 sm:mb-6 pb-5 sm:pb-6 border-b border-white/10">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-pink-500/50"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold truncate">{user.displayName || 'Usuario'}</p>
              <p className="text-[10px] sm:text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Opciones del menú */}
        <nav className="flex-1 space-y-2">
          {menuItems.map(
            (item, index) =>
              item.show && (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/50 transition-all active:scale-95 touch-manipulation"
                >
                  <item.icon size={18} className="text-pink-500 sm:w-5 sm:h-5" />
                  <span className="font-medium text-sm sm:text-base">{item.label}</span>
                </button>
              )
          )}

          {/* Selector de tema */}
          <div className="pt-3">
            <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold mb-2 px-4">
              <Palette size={12} className="inline mr-1" />
              Theme
            </p>
            <div className="space-y-1.5">
              {Object.values(themes).map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme.id)}
                  className={`w-full p-2.5 rounded-xl transition-all border flex items-center gap-3 active:scale-95 touch-manipulation ${
                    themeId === theme.id
                      ? 'border-white/30 bg-white/10'
                      : 'border-white/5 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${theme.colors.primaryFrom}, ${theme.colors.primaryTo})`,
                    }}
                  />
                  <div className="text-left">
                    <p className="font-bold text-xs text-white">{theme.name}</p>
                    <p className="text-[10px] text-gray-400">{theme.description}</p>
                  </div>
                  {themeId === theme.id && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Selector de idioma */}
          <div className="pt-3">
            <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-bold mb-2 px-4">
              <Globe size={12} className="inline mr-1" />
              Idioma
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onChangeLocale('es');
                  onClose();
                }}
                className={`px-3 sm:px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 touch-manipulation ${
                  currentLocale === 'es'
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white'
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                🇪🇸 ES
              </button>
              <button
                onClick={() => {
                  onChangeLocale('en');
                  onClose();
                }}
                className={`px-3 sm:px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 touch-manipulation ${
                  currentLocale === 'en'
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white'
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                🇺🇸 EN
              </button>
            </div>
          </div>
        </nav>

        {/* Botón de logout */}
        {user && (
          <button
            onClick={() => {
              onSignOut();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 transition-all active:scale-95 touch-manipulation mt-4"
          >
            <LogOut size={18} className="sm:w-5 sm:h-5" />
            <span className="font-bold text-sm sm:text-base">{t('common.signOut')}</span>
          </button>
        )}

        {/* Version */}
        <p className="text-center text-[10px] text-gray-600 mt-4">v2.4.0</p>
      </div>
    </div>
  );
}
